/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { ValueCell } from 'mol-util';
import { ArrayKind, BufferItemSize, ElementsKind, AttributeValues } from '../webgl/buffer';
import { UniformKind, UniformValues } from '../webgl/uniform';
import { DefineKind, DefineValues } from '../shader-code';
import { Vec2, Vec3, Vec4, Mat3, Mat4 } from 'mol-math/linear-algebra';
import { TextureImage, TextureVolume } from './util';
import { TextureValues, TextureType, TextureFormat, TextureFilter, TextureKind, Texture } from '../webgl/texture';
import { Sphere3D } from 'mol-math/geometry';

export type ValueKindType = {
    'number': number
    'string': string
    'boolean': string
    'any': any

    'm4': Mat4,
    'float32': Float32Array
    'sphere': Sphere3D
}
export type ValueKind = keyof ValueKindType

//

export type KindValue = {
    'f': number
    'i': number
    'v2': Vec2
    'v3': Vec3
    'v4': Vec4
    'm3': Mat3
    'm4': Mat4
    't': number

    'uint8': Uint8Array
    'int8': Int8Array
    'uint16': Uint16Array
    'int16': Int16Array
    'uint32': Uint32Array
    'int32': Int32Array
    'float32': Float32Array

    'image-uint8': TextureImage<Uint8Array>
    'image-float32': TextureImage<Float32Array>
    'volume-uint8': TextureVolume<Uint8Array>
    'volume-float32': TextureVolume<Float32Array>
    'texture': Texture
    'texture2d': Texture
    'texture3d': Texture

    'number': number
    'string': string
    'boolean': boolean
    'any': any

    'sphere': Sphere3D
}

export type Values<S extends RenderableSchema> = { [k in keyof S]: ValueCell<KindValue[S[k]['kind']]> }

export function splitValues(schema: RenderableSchema, values: RenderableValues) {
    const attributeValues: AttributeValues = {}
    const defineValues: DefineValues = {}
    const textureValues: TextureValues = {}
    const uniformValues: UniformValues = {}
    Object.keys(schema).forEach(k => {
        if (schema[k].type === 'attribute') attributeValues[k] = values[k]
        if (schema[k].type === 'define') defineValues[k] = values[k]
        if (schema[k].type === 'texture') textureValues[k] = values[k]
        if (schema[k].type === 'uniform') uniformValues[k] = values[k]
    })
    return { attributeValues, defineValues, textureValues, uniformValues }
}

export function splitKeys(schema: RenderableSchema) {
    const attributeKeys: string[] = []
    const defineKeys: string[] = []
    const textureKeys: string[] = []
    const uniformKeys: string[] = []
    Object.keys(schema).forEach(k => {
        if (schema[k].type === 'attribute') attributeKeys.push(k)
        if (schema[k].type === 'define') defineKeys.push(k)
        if (schema[k].type === 'texture') textureKeys.push(k)
        if (schema[k].type === 'uniform') uniformKeys.push(k)
    })
    return { attributeKeys, defineKeys, textureKeys, uniformKeys }
}

export type Versions<T extends RenderableValues> = { [k in keyof T]: number }
export function getValueVersions<T extends RenderableValues>(values: T) {
    const versions: Versions<any> = {}
    Object.keys(values).forEach(k => {
        versions[k] = values[k].ref.version
    })
    return versions as Versions<T>
}

//

export type AttributeSpec<K extends ArrayKind> = { type: 'attribute', kind: K, itemSize: BufferItemSize, divisor: number }
export function AttributeSpec<K extends ArrayKind>(kind: K, itemSize: BufferItemSize, divisor: number): AttributeSpec<K> {
    return { type: 'attribute', kind, itemSize, divisor }
}

export type UniformSpec<K extends UniformKind> = { type: 'uniform', kind: K }
export function UniformSpec<K extends UniformKind>(kind: K): UniformSpec<K> {
    return { type: 'uniform', kind }
}

export type TextureSpec<K extends TextureKind> = { type: 'texture', kind: K, format: TextureFormat, dataType: TextureType, filter: TextureFilter }
export function TextureSpec<K extends TextureKind>(kind: K, format: TextureFormat, dataType: TextureType, filter: TextureFilter): TextureSpec<K> {
    return { type: 'texture', kind, format, dataType, filter }
}

export type ElementsSpec<K extends ElementsKind> = { type: 'elements', kind: K }
export function ElementsSpec<K extends ElementsKind>(kind: K): ElementsSpec<K> {
    return { type: 'elements', kind }
}

export type DefineSpec<K extends DefineKind> = { type: 'define', kind: K, options?: string[] }
export function DefineSpec<K extends DefineKind>(kind: K, options?: string[]): DefineSpec<K> {
    return { type: 'define', kind, options }
}

export type ValueSpec<K extends ValueKind> = { type: 'value', kind: K }
export function ValueSpec<K extends ValueKind>(kind: K): ValueSpec<K> {
    return { type: 'value', kind }
}

//

export type RenderableSchema = {
    [k: string]: (
        AttributeSpec<ArrayKind> | UniformSpec<UniformKind> | TextureSpec<TextureKind> |
        ValueSpec<ValueKind> | DefineSpec<DefineKind> | ElementsSpec<ElementsKind>
    )
}
export type RenderableValues = { [k: string]: ValueCell<any> }

//

export const GlobalUniformSchema = {
    uModel: UniformSpec('m4'),
    uView: UniformSpec('m4'),
    uInvView: UniformSpec('m4'),
    uModelView: UniformSpec('m4'),
    uInvModelView: UniformSpec('m4'),
    uProjection: UniformSpec('m4'),
    uInvProjection: UniformSpec('m4'),
    uModelViewProjection: UniformSpec('m4'),
    uInvModelViewProjection: UniformSpec('m4'),
    // uLightPosition: Uniform('v3'),
    uLightColor: UniformSpec('v3'),
    uLightAmbient: UniformSpec('v3'),

    uPixelRatio: UniformSpec('f'),
    uViewportHeight: UniformSpec('f'),
    uViewport: UniformSpec('v4'),

    uCameraPosition: UniformSpec('v3'),
    uFogNear: UniformSpec('f'),
    uFogFar: UniformSpec('f'),
    uFogColor: UniformSpec('v3'),

    uPickingAlphaThreshold: UniformSpec('f'),
}
export type GlobalUniformSchema = typeof GlobalUniformSchema
export type GlobalUniformValues = { [k in keyof GlobalUniformSchema]: ValueCell<any> }

export const InternalSchema = {
    uObjectId: UniformSpec('i'),
    uPickable: UniformSpec('i'),
}
export type InternalSchema = typeof InternalSchema
export type InternalValues = { [k in keyof InternalSchema]: ValueCell<any> }

export const ColorSchema = {
    // aColor: AttributeSpec('float32', 3, 0), // TODO
    uColor: UniformSpec('v3'),
    uColorTexDim: UniformSpec('v2'),
    tColor: TextureSpec('image-uint8', 'rgb', 'ubyte', 'nearest'),
    dColorType: DefineSpec('string', ['uniform', 'attribute', 'instance', 'group', 'group_instance']),
}
export type ColorSchema = typeof ColorSchema
export type ColorValues = Values<ColorSchema>

export const SizeSchema = {
    // aSize: AttributeSpec('float32', 1, 0), // TODO
    uSize: UniformSpec('f'),
    uSizeTexDim: UniformSpec('v2'),
    tSize: TextureSpec('image-uint8', 'alpha', 'ubyte', 'nearest'),
    dSizeType: DefineSpec('string', ['uniform', 'attribute', 'instance', 'group', 'group_instance']),
    uSizeFactor: UniformSpec('f'),
}
export type SizeSchema = typeof SizeSchema
export type SizeValues = Values<SizeSchema>

export const BaseSchema = {
    ...ColorSchema,

    aInstance: AttributeSpec('float32', 1, 1),
    aGroup: AttributeSpec('float32', 1, 0),
    /**
     * final per-instance transform calculated for instance `i` as
     * `aTransform[i] = matrix * transform[i] * extraTransform[i]`
     */
    aTransform: AttributeSpec('float32', 16, 1),

    uAlpha: UniformSpec('f'),
    uInstanceCount: UniformSpec('i'),
    uGroupCount: UniformSpec('i'),
    uMarkerTexDim: UniformSpec('v2'),
    uHighlightColor: UniformSpec('v3'),
    uSelectColor: UniformSpec('v3'),

    tMarker: TextureSpec('image-uint8', 'alpha', 'ubyte', 'nearest'),

    drawCount: ValueSpec('number'),
    instanceCount: ValueSpec('number'),

    /** global transform, see aTransform */
    matrix: ValueSpec('m4'),
    /** base per-instance transform, see aTransform */
    transform: ValueSpec('float32'),
    /** additional per-instance transform, see aTransform */
    extraTransform: ValueSpec('float32'),

    /** bounding sphere taking aTransform into account */
    boundingSphere: ValueSpec('sphere'),
    /** bounding sphere NOT taking aTransform into account */
    invariantBoundingSphere: ValueSpec('sphere'),

    dUseFog: DefineSpec('boolean'),
}
export type BaseSchema = typeof BaseSchema
export type BaseValues = Values<BaseSchema>