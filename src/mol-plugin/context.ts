/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { StateTree, StateSelection, Transformer } from 'mol-state';
import Canvas3D from 'mol-canvas3d/canvas3d';
import { StateTransforms } from './state/transforms';
import { PluginStateObjects as SO } from './state/objects';
import { RxEventHelper } from 'mol-util/rx-event-helper';
import { PluginState } from './state';

export class PluginContext {
    private disposed = false;
    private ev = RxEventHelper.create();

    readonly state = new PluginState();

    readonly events = {
        stateUpdated: this.ev<undefined>()
    };

    readonly canvas3d: Canvas3D;

    initViewer(canvas: HTMLCanvasElement, container: HTMLDivElement) {
        try {
            (this.canvas3d as Canvas3D) = Canvas3D.create(canvas, container);
            this.canvas3d.animate();
            console.log('canvas3d created');
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * This should be used in all transform related request so that it could be "spoofed" to allow
     * "static" access to resources.
     */
    async fetch(url: string, type: 'string' | 'binary' = 'string'): Promise<string | Uint8Array> {
        const req = await fetch(url);
        return type === 'string' ? await req.text() : new Uint8Array(await req.arrayBuffer());
    }

    dispose() {
        if (this.disposed) return;
        this.canvas3d.dispose();
        this.ev.dispose();
        this.state.dispose();
        this.disposed = true;
    }

    _test_createState(url: string) {
        const b = StateTree.build(this.state.data.tree);
        const newTree = b.toRoot()
            .apply(StateTransforms.Data.Download, { url })
            .apply(StateTransforms.Data.ParseCif)
            .apply(StateTransforms.Model.CreateModelsFromMmCif, {}, { ref: 'models' })
            .apply(StateTransforms.Model.CreateStructureFromModel, { modelIndex: 0 }, { ref: 'structure' })
            .apply(StateTransforms.Visuals.CreateStructureRepresentation)
            .getTree();

        this._test_updateStateData(newTree);
    }

    async _test_updateStateData(tree: StateTree) {
        await this.state.data.update(tree).run(p => console.log(p), 250);
        console.log(this.state.data);
        this.events.stateUpdated.next();
    }

    private initEvents() {
        this.state.data.context.events.object.created.subscribe(o => {
            if (!SO.StructureRepresentation3D.is(o.obj)) return;
            console.log('adding repr', o.obj.data.repr);
            this.canvas3d.add(o.obj.data.repr);
            this.canvas3d.requestDraw(true);
        });
        this.state.data.context.events.object.updated.subscribe(o => {
            const oo = o.obj;
            if (!SO.StructureRepresentation3D.is(oo)) return;
            console.log('adding repr', oo.data.repr);
            this.canvas3d.add(oo.data.repr);
            this.canvas3d.requestDraw(true);
        });
    }

    _test_centerView() {
        const sel = StateSelection.select('structure', this.state.data);
        const center = (sel[0].obj! as SO.Structure).data.boundary.sphere.center;
        console.log({ sel, center, rc: this.canvas3d.reprCount });
        this.canvas3d.center(center);
        this.canvas3d.requestDraw(true);
    }

    _test_nextModel() {
        const models = StateSelection.select('models', this.state.data)[0].obj as SO.Models;
        const idx = (this.state.data.tree.getValue('structure')!.params as Transformer.Params<typeof StateTransforms.Model.CreateStructureFromModel>).modelIndex;
        console.log({ idx });
        const newTree = StateTree.updateParams(this.state.data.tree, 'structure', { modelIndex: (idx + 1) % models.data.length });
        return this._test_updateStateData(newTree);
        // this.viewer.requestDraw(true);
    }

    _test_playModels() {
        const update = async () => {
            await this._test_nextModel();
            setTimeout(update, 1000 / 15);
        }
        update();
    }

    constructor() {
        this.initEvents();
    }

    // logger = ;
    // settings = ;
}