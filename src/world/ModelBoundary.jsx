import React from 'react'

// Si el modelo 3D falla al cargar/parsear (archivo ausente, FBX corrupto, etc.)
// caemos al avatar de primitivas en vez de romper toda la escena.
export class ModelBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn('Avatar 3D no disponible, usando primitivas:', err?.message || err)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
