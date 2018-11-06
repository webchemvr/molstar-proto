/**
 * Copyright (c) 2018 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

export type GLRenderingContext = WebGLRenderingContext | WebGL2RenderingContext

export function isWebGL(gl: any): gl is WebGLRenderingContext {
    return typeof WebGLRenderingContext !== 'undefined' && gl instanceof WebGLRenderingContext
}

export function isWebGL2(gl: any): gl is WebGL2RenderingContext {
    return typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext
}

export interface COMPAT_instanced_arrays {
    drawArraysInstanced(mode: number, first: number, count: number, primcount: number): void;
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, primcount: number): void;
    vertexAttribDivisor(index: number, divisor: number): void;
    readonly VERTEX_ATTRIB_ARRAY_DIVISOR: number;
}

export function getInstancedArrays(gl: GLRenderingContext): COMPAT_instanced_arrays | null {
    if (isWebGL2(gl)) {
        return {
            drawArraysInstanced: gl.drawArraysInstanced.bind(gl),
            drawElementsInstanced: gl.drawElementsInstanced.bind(gl),
            vertexAttribDivisor: gl.vertexAttribDivisor.bind(gl),
            VERTEX_ATTRIB_ARRAY_DIVISOR: gl.VERTEX_ATTRIB_ARRAY_DIVISOR
        }
    } else {
        const ext = gl.getExtension('ANGLE_instanced_arrays')
        if (ext === null) return null
        return {
            drawArraysInstanced: ext.drawArraysInstancedANGLE.bind(ext),
            drawElementsInstanced: ext.drawElementsInstancedANGLE.bind(ext),
            vertexAttribDivisor: ext.vertexAttribDivisorANGLE.bind(ext),
            VERTEX_ATTRIB_ARRAY_DIVISOR: ext.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE
        }
    }
}

export interface COMPAT_standard_derivatives {
    readonly FRAGMENT_SHADER_DERIVATIVE_HINT: number;
}

export function getStandardDerivatives(gl: GLRenderingContext): COMPAT_standard_derivatives | null {
    if (isWebGL2(gl)) {
        return { FRAGMENT_SHADER_DERIVATIVE_HINT: gl.FRAGMENT_SHADER_DERIVATIVE_HINT }
    } else {
        const ext = gl.getExtension('OES_standard_derivatives')
        if (ext === null) {
            throw new Error('Could not get "OES_standard_derivatives" extension')
        }
        return { FRAGMENT_SHADER_DERIVATIVE_HINT: ext.FRAGMENT_SHADER_DERIVATIVE_HINT_OES }
    }
}

export interface COMPAT_element_index_uint {
}

export function getElementIndexUint(gl: GLRenderingContext): COMPAT_element_index_uint | null {
    return isWebGL2(gl) ? {} : gl.getExtension('OES_element_index_uint')
}

export interface COMPAT_vertex_array_object {
    readonly VERTEX_ARRAY_BINDING: number;
    bindVertexArray(arrayObject: WebGLVertexArrayObject | null): void;
    createVertexArray(): WebGLVertexArrayObject | null;
    deleteVertexArray(arrayObject: WebGLVertexArrayObject): void;
    isVertexArray(value: any): value is WebGLVertexArrayObject;
}

export function getVertexArrayObject(gl: GLRenderingContext): COMPAT_vertex_array_object | null {
    if (isWebGL2(gl)) {
        return {
            VERTEX_ARRAY_BINDING: gl.VERTEX_ARRAY_BINDING,
            bindVertexArray: gl.bindVertexArray.bind(gl),
            createVertexArray: gl.createVertexArray.bind(gl),
            deleteVertexArray: gl.deleteVertexArray.bind(gl),
            isVertexArray: gl.isVertexArray.bind(gl) as (value: any) => value is WebGLVertexArrayObject // TODO change when webgl2 types are fixed
        }
    } else {
        const ext = gl.getExtension('OES_vertex_array_object')
        if (ext === null) return null
        return {
            VERTEX_ARRAY_BINDING: ext.VERTEX_ARRAY_BINDING_OES,
            bindVertexArray: ext.bindVertexArrayOES.bind(ext),
            createVertexArray: ext.createVertexArrayOES.bind(ext),
            deleteVertexArray: ext.deleteVertexArrayOES.bind(ext),
            isVertexArray: ext.isVertexArrayOES.bind(ext)
        }
    }
}

export interface COMPAT_texture_float {
}

export function getTextureFloat(gl: GLRenderingContext): COMPAT_texture_float | null {
    return isWebGL2(gl) ? {} : gl.getExtension('OES_texture_float')
}

export interface COMPAT_texture_float_linear {
}

export function getTextureFloatLinear(gl: GLRenderingContext): COMPAT_texture_float_linear | null {
    return gl.getExtension('OES_texture_float_linear')
}

export interface COMPAT_blend_minmax {
    readonly MIN: number
    readonly MAX: number
}

export function getBlendMinMax(gl: GLRenderingContext): COMPAT_blend_minmax | null {
    if (isWebGL2(gl)) {
        return { MIN: gl.MIN, MAX: gl.MAX }
    } else {
        const ext = gl.getExtension('EXT_blend_minmax')
        if (ext === null) return null
        return { MIN: ext.MIN_EXT, MAX: ext.MAX_EXT }
    }
}

export interface COMPAT_frag_depth {
}

export function getFragDepth(gl: GLRenderingContext): COMPAT_frag_depth | null {
    return isWebGL2(gl) ? {} : gl.getExtension('EXT_frag_depth')
}