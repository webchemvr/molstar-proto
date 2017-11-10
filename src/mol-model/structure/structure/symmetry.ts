/**
 * Copyright (c) 2017 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import Structure from './structure'
import AtomSet from './atom/set'
import Unit from './unit'
import { Selection } from '../query'
import { ModelSymmetry } from '../model'

namespace Symmetry {
    export const  buildAssembly = buildAssemblyImpl;
}

export default Symmetry;

function buildAssemblyImpl(structure: Structure, name: string) {
    const models = Structure.getModels(structure);
    if (models.length !== 1) throw new Error('Can only build assemblies from structures based on 1 model.');

    const assembly = ModelSymmetry.findAssembly(models[0], name);
    if (!assembly) throw new Error(`Assembly '${name}' is not defined.`);

    const { operatorGroups } = assembly;

    const assemblyUnits = Object.create(null);
    const assemblyAtoms = Object.create(null);

    for (const g of operatorGroups) {
        const selection = g.selector(structure);
        if (Selection.structureCount(selection) === 0) continue;
        const { units, atoms } = Selection.union(selection);

        const unitIds = AtomSet.unitIds(atoms);

        for (const oper of g.operators) {
            for (let uI = 0, _uI = unitIds.length; uI < _uI; uI++) {
                const unitId = unitIds[uI];
                const unit = units[unitId];

                const newUnit = Unit.create(unit.model, oper);
                assemblyUnits[newUnit.id] = newUnit;
                assemblyAtoms[newUnit.id] = AtomSet.unitGetByIndex(atoms, uI);
            }
        }
    }

    return Structure.create(assemblyUnits, AtomSet.create(assemblyAtoms));
}