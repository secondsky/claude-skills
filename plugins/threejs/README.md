# Three.js Skills Plugin

Comprehensive Three.js knowledge base for Claude Code, providing accurate API references, best practices, and working code examples for building 3D web experiences.

## What This Plugin Provides

- **10 detailed topic references** covering all major Three.js domains
- **Quick start examples** for common tasks
- **Accurate API signatures** for Three.js r160+
- **Performance optimization tips**
- **Working code patterns**

## Topics Covered

1. **Fundamentals** - Scene setup, cameras, renderer, Object3D hierarchy
2. **Geometry** - Built-in shapes, BufferGeometry, custom geometry
3. **Materials** - PBR materials, shader materials, material properties
4. **Lighting** - Light types, shadows, environment lighting
5. **Textures** - UV mapping, environment maps, render targets
6. **Animation** - Keyframe/skeletal animation, animation mixing
7. **Loaders** - GLTF/GLB loading, async patterns
8. **Shaders** - GLSL basics, ShaderMaterial, custom effects
9. **Postprocessing** - EffectComposer, bloom, DOF, screen effects
10. **Interaction** - Raycasting, camera controls, input handling

## Installation

### Via Claude Skills Repository

This plugin is part of the [claude-skills](https://github.com/secondsky/claude-skills) repository.

```bash
cd /path/to/claude-skills
./scripts/install-skill.sh threejs
```

### Manual Installation

```bash
# Clone or copy to your project
cp -r plugins/threejs /your/project/.claude-plugin/

# Or symlink to Claude Code global plugins
ln -s $(pwd)/plugins/threejs ~/.claude/plugins/threejs
```

## Usage

Claude Code automatically loads Three.js knowledge when you work with 3D graphics. Common trigger phrases:

- "Create a Three.js scene with..."
- "Add a rotating cube"
- "Load a GLTF model"
- "Implement custom shader"
- "Add bloom effect"
- "Set up raycasting for mouse picking"

## Three.js Version

This plugin is verified for **Three.js r160+** (January 2024) and uses the modern ES6 import format:

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
```

## Examples

See `skills/threejs/SKILL.md` for quick start examples across all topics.

## Source

Based on the excellent [threejs-skills](https://github.com/CloudAI-X/threejs-skills) repository by CloudAI-X, adapted for the claude-skills plugin structure.

## License

MIT License - See LICENSE file for details.

## Credits

- Original skills: [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills)
- Adapted for claude-skills by: Claude Skills Maintainers
- Three.js: [https://threejs.org](https://threejs.org)
