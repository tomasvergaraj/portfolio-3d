import React, { useMemo, useRef } from 'react'
import { useGLTF, useFBX } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three-stdlib'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// Cargador genérico de props 3D (GLB, FBX u OBJ) con auto-ajuste: como los
// modelos vienen con escalas muy distintas (algunos en cm, otros con scale
// interno en el nodo), medimos su bounding-box real y los escalamos a una altura
// objetivo, apoyando la base en el suelo. Así cualquier modelo "encaja" sin
// tunear a mano.

const GROUND_Y = 0.72
const _box = new THREE.Box3()
const _size = new THREE.Vector3()

const isFbx = (url) => /\.fbx$/i.test(url)
const isObj = (url) => /\.obj$/i.test(url)

// Paleta low-poly para OBJ sin texturas (mapeada por nombre de material). Por
// defecto piedra clara; los nombres conocidos del modelo de fuente se afinan.
const OBJ_PALETTE = {
  '02___default': '#c9c4ba', // piedra principal
  '03___default': '#ada596', // detalles / molduras
  '_crayfishdiffuse': '#6aa6c8', // agua
}
const OBJ_STONE = '#c9c4ba'

function objMaterialFor(name) {
  const key = (name || '').toLowerCase()
  return new THREE.MeshStandardMaterial({
    color: OBJ_PALETTE[key] || OBJ_STONE,
    roughness: 1,
    flatShading: true,
  })
}

function tune(o) {
  o.traverse((n) => {
    if (n.isMesh) {
      n.castShadow = true
      n.receiveShadow = false
      n.frustumCulled = false
    }
  })
}

// Coloca un modelo ya cargado: lo clona (comparte geometría), lo escala a
// `targetH` (× scaleMul) y apoya su base en el suelo. `rot` puede ser un número
// (giro en Y) o [x,y,z]. La rotación extra se aplica a un grupo interno para no
// alterar el cálculo de "base sobre el suelo".
function Placed({ source, position, targetH, scaleMul = 1, rot = 0, groundY = GROUND_Y, sway = 0 }) {
  const model = useMemo(() => {
    const c = source.clone(true)
    tune(c)
    return c
  }, [source])

  const euler = Array.isArray(rot) ? rot : [0, rot || 0, 0]
  const innerRef = useRef()
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])

  const { s, baseLift } = useMemo(() => {
    model.updateMatrixWorld(true) // aplica los transforms internos del nodo
    _box.setFromObject(model)
    _box.getSize(_size)
    const h = _size.y || 1
    const s = (targetH / h) * scaleMul
    return { s, baseLift: -_box.min.y }
  }, [model, targetH, scaleMul])

  // Vaivén de viento opcional (p. ej. árboles): mece el modelo desde su base.
  useFrame((state) => {
    if (!sway || !innerRef.current) return
    const t = state.clock.elapsedTime
    innerRef.current.rotation.z = euler[2] + Math.sin(t * 0.8 + phase) * sway
    innerRef.current.rotation.x = euler[0] + Math.cos(t * 0.6 + phase) * sway * 0.7
  })

  return (
    <group position={[position[0], groundY, position[2]]} rotation={[0, euler[1], 0]} scale={s}>
      {/* Inclinación (x/z) alrededor del propio modelo, ya apoyado en el suelo */}
      <group ref={innerRef} rotation={[euler[0], 0, euler[2]]}>
        <primitive object={model} position={[0, baseLift, 0]} />
      </group>
    </group>
  )
}

function GlbInstance(props) {
  const { scene } = useGLTF(props.url)
  return <Placed source={scene} {...props} />
}
function FbxInstance(props) {
  const obj = useFBX(props.url)
  return <Placed source={obj} {...props} />
}
function ObjInstance(props) {
  const raw = useLoader(OBJLoader, props.url)
  // Los OBJ suelen traer la geometría desplazada lejos del origen y sin material
  // utilizable. La recentramos (centro en x/z, base en y=0) y recoloreamos por
  // nombre de material para que encaje en el mundo low-poly.
  const source = useMemo(() => {
    const c = raw.clone(true)
    c.updateMatrixWorld(true)
    _box.setFromObject(c)
    const cx = (_box.min.x + _box.max.x) / 2
    const cz = (_box.min.z + _box.max.z) / 2
    const minY = _box.min.y
    c.traverse((o) => {
      if (!o.isMesh) return
      o.geometry = o.geometry.clone()
      o.geometry.translate(-cx, -minY, -cz)
      o.material = Array.isArray(o.material)
        ? o.material.map((m) => objMaterialFor(m.name))
        : objMaterialFor(o.material?.name)
    })
    return c
  }, [raw])
  return <Placed source={source} {...props} />
}

// Instancia un modelo por URL, eligiendo el loader según la extensión.
export function Instance({ url, ...rest }) {
  if (isObj(url)) return <ObjInstance url={url} {...rest} />
  if (isFbx(url)) return <FbxInstance url={url} {...rest} />
  return <GlbInstance url={url} {...rest} />
}

export function preloadModel(url) {
  if (isObj(url)) useLoader.preload(OBJLoader, url)
  else if (isFbx(url)) useFBX.preload(url)
  else useGLTF.preload(url)
}
