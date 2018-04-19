import * as util from 'util'
import * as fs from 'fs'
import CIF from 'mol-io/reader/cif'

import { Structure, Model } from 'mol-model/structure'

import { Run } from 'mol-task';
import { build, inSphere } from 'mol-math/geometry/lookup3d/grid';
import { sortArray } from 'mol-data/util';

require('util.promisify').shim();
const readFileAsync = util.promisify(fs.readFile);

async function readData(path: string) {
    if (path.match(/\.bcif$/)) {
        const input = await readFileAsync(path)
        const data = new Uint8Array(input.byteLength);
        for (let i = 0; i < input.byteLength; i++) data[i] = input[i];
        return data;
    } else {
        return readFileAsync(path, 'utf8');
    }
}


export async function readCIF(path: string) {
    const input = await readData(path)
    const comp = typeof input === 'string' ? CIF.parseText(input) : CIF.parseBinary(input);
    const parsed = await Run(comp);
    if (parsed.isError) {
        throw parsed;
    }

    const data = parsed.result.blocks[0];
    const mmcif = CIF.schema.mmCIF(data);
    const models = Model.create({ kind: 'mmCIF', data: mmcif });
    const structures = models.map(Structure.ofModel);

    return { mmcif, models, structures };
}

export async function test() {
    const { mmcif  } = await readCIF('e:/test/quick/1tqn_updated.cif');

    const data = build({ x: mmcif.atom_site.Cartn_x.toArray(), y: mmcif.atom_site.Cartn_y.toArray(), z: mmcif.atom_site.Cartn_z.toArray(),
        //indices: [0, 1, 2, 3]
        //indices: [1]
    });
    console.log(data.boundingBox, data.boundingSphere);

    const result = inSphere(data, -30.07, 8.178, -13.897, 10);
    console.log(result.count, sortArray(result.indices));
}

test();