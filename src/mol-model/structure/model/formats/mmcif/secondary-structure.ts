
/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author David Sehnal <david.sehnal@gmail.com>
 */

import { mmCIF_Database as mmCIF, mmCIF_Database } from 'mol-io/reader/cif/schema/mmcif'
import { SecondaryStructureType } from '../../types';
import { AtomicHierarchy } from '../../properties/atomic';
import { SecondaryStructure } from '../../properties/seconday-structure';
import { Column } from 'mol-data/db';

export function getSecondaryStructureMmCif(data: mmCIF_Database, hierarchy: AtomicHierarchy): SecondaryStructure {
    const map: SecondaryStructureMap = new Map();
    addHelices(data.struct_conf, map);
    // must add Helices 1st because of 'key' value assignment.
    addSheets(data.struct_sheet_range, map, data.struct_conf._rowCount);

    const secStruct: SecondaryStructureData = {
        type: new Int32Array(hierarchy.residues._rowCount) as any,
        key: new Int32Array(hierarchy.residues._rowCount) as any
    };

    if (map.size > 0) assignSecondaryStructureRanges(hierarchy, map, secStruct);
    return secStruct;
}

type SecondaryStructureEntry = {
    startSeqNumber: number,
    startInsCode: string | null,
    endSeqNumber: number,
    endInsCode: string | null,
    type: SecondaryStructureType,
    key: number
}
type SecondaryStructureMap = Map<string, Map<number, SecondaryStructureEntry>>
type SecondaryStructureData = { type: SecondaryStructureType[], key: number[] }

function addHelices(cat: mmCIF['struct_conf'], map: SecondaryStructureMap) {
    if (!cat._rowCount) return;

    const { beg_label_asym_id, beg_label_seq_id, pdbx_beg_PDB_ins_code } = cat;
    const { end_label_seq_id, pdbx_end_PDB_ins_code } = cat;
    const { pdbx_PDB_helix_class, conf_type_id } = cat;

    for (let i = 0, _i = cat._rowCount; i < _i; i++) {
        const type =  pdbx_PDB_helix_class.valueKind(i) === Column.ValueKind.Present
            ? SecondaryStructureType.SecondaryStructurePdb[pdbx_PDB_helix_class.value(i)]
            : conf_type_id.valueKind(i) === Column.ValueKind.Present
            ? SecondaryStructureType.SecondaryStructureMmcif[conf_type_id.value(i)]
            : SecondaryStructureType.Flag.NA

        const entry: SecondaryStructureEntry = {
            startSeqNumber: beg_label_seq_id.value(i),
            startInsCode: pdbx_beg_PDB_ins_code.value(i),
            endSeqNumber: end_label_seq_id.value(i),
            endInsCode: pdbx_end_PDB_ins_code.value(i),
            type: SecondaryStructureType.create(type),
            key: i + 1
        };

        const asymId = beg_label_asym_id.value(i)!;
        if (map.has(asymId)) {
            map.get(asymId)!.set(entry.startSeqNumber, entry);
        } else {
            map.set(asymId, new Map([[entry.startSeqNumber, entry]]));
        }
    }
}

function addSheets(cat: mmCIF['struct_sheet_range'], map: SecondaryStructureMap, sheetCount: number) {
    if (!cat._rowCount) return;

    const { beg_label_asym_id, beg_label_seq_id, pdbx_beg_PDB_ins_code } = cat;
    const { end_label_seq_id, pdbx_end_PDB_ins_code } = cat;
    const { sheet_id } = cat;

    const sheet_id_key = new Map<string, number>();
    let currentKey = sheetCount + 1;

    for (let i = 0, _i = cat._rowCount; i < _i; i++) {
        const id = sheet_id.value(i);
        let key: number;
        if (sheet_id_key.has(id)) key = sheet_id_key.get(id)!;
        else {
            key = currentKey++;
            sheet_id_key.set(id, key);
        }

        const entry: SecondaryStructureEntry = {
            startSeqNumber: beg_label_seq_id.value(i),
            startInsCode: pdbx_beg_PDB_ins_code.value(i),
            endSeqNumber: end_label_seq_id.value(i),
            endInsCode: pdbx_end_PDB_ins_code.value(i),
            type: SecondaryStructureType.create(SecondaryStructureType.Flag.Beta | SecondaryStructureType.Flag.BetaSheet),
            key
        };

        const asymId = beg_label_asym_id.value(i)!;
        if (map.has(asymId)) {
            map.get(asymId)!.set(entry.startSeqNumber, entry);
        } else {
            map.set(asymId, new Map([[entry.startSeqNumber, entry]]));
        }
    }

    return;
}

function assignSecondaryStructureEntry(hierarchy: AtomicHierarchy, entry: SecondaryStructureEntry, resStart: number, resEnd: number, data: SecondaryStructureData) {
    const { label_seq_id, pdbx_PDB_ins_code } = hierarchy.residues;
    const { endSeqNumber, endInsCode, type, key } = entry;

    let rI = resStart;
    while (rI < resEnd) {
        const seqNumber = label_seq_id.value(rI);

        data.type[rI] = type;
        data.key[rI] = key;

        if ((seqNumber > endSeqNumber) ||
            (seqNumber === endSeqNumber && pdbx_PDB_ins_code.value(rI) === endInsCode)) {
            break;
        }

        rI++;
    }
}

function assignSecondaryStructureRanges(hierarchy: AtomicHierarchy, map: SecondaryStructureMap, data: SecondaryStructureData) {
    const { segments: chainSegments, count: chainCount } = hierarchy.chainSegments;
    const { label_asym_id } = hierarchy.chains;
    const { label_seq_id, pdbx_PDB_ins_code } = hierarchy.residues;

    for (let cI = 0; cI < chainCount; cI++) {
        const resStart = chainSegments[cI], resEnd = chainSegments[cI + 1];
        const asymId = label_asym_id.value(cI);

        if (map.has(asymId)) {
            const entries = map.get(asymId)!;

            for (let rI = resStart; rI < resEnd; rI++) {
                const seqNumber = label_seq_id.value(rI);
                if (entries.has(seqNumber)) {
                    const entry = entries.get(seqNumber)!;
                    const insCode = pdbx_PDB_ins_code.value(rI);
                    if (entry.startInsCode !== insCode) continue;
                    assignSecondaryStructureEntry(hierarchy, entry, rI, resEnd, data);
                }
            }
        }
    }
}