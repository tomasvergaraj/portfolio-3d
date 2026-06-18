import React, { useMemo } from 'react'
import { useGLTF, useFBX } from '@react-three/drei'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// Cargador genérico de props 3D (GLB o FBX) con auto-ajuste: como los modelos
// vienen con escalas muy distintas (algunos en cm, otros con scale interno en
// el nodo), medimos su bounding-box real y los escalamos a una altura objetivo,
// apoyando la base en el suelo. Así cualquier modelo "encaja" sin tunear a mano.

const GROUND_Y = 0.72
const _box = new THREE.Box3()
const _size = new THREE.Vector3()

const isFbx = (url) => /\.fbx$/i.test(url)

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
function Placed({ source, position, targetH, scaleMul = 1, rot = 0, groundY = GROUND_Y }) {
  const model = useMemo(() => {
    const c = source.clone(true)
    tune(c)
    return c
  }, [source])

  const euler = Array.isArray(rot) ? rot : [0, rot || 0, 0]

  const { s, baseLift } = useMemo(() => {
    model.updateMatrixWorld(true) // aplica los transforms internos del nodo
    _box.setFromObject(model)
    _box.getSize(_size)
    const h = _size.y || 1
    const s = (targetH / h) * scaleMul
    return { s, baseLift: -_box.min.y }
  }, [model, targetH, scaleMul])

  return (
    <group position={[position[0], groundY, position[2]]} rotation={[0, euler[1], 0]} scale={s}>
      {/* Inclinación (x/z) alrededor del propio modelo, ya apoyado en el suelo */}
      <group rotation={[euler[0], 0, euler[2]]}>
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

// Instancia un modelo por URL, eligiendo el loader según la extensión.
export function Instance({ url, ...rest }) {
  return isFbx(url) ? <FbxInstance url={url} {...rest} /> : <GlbInstance url={url} {...rest} />
}

export function preloadModel(url) {
  if (isFbx(url)) useFBX.preload(url)
  else useGLTF.preload(url)
}
