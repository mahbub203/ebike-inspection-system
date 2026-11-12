import { CameraViewDefinition } from '../types';

export const CAMERA_VIEWS: CameraViewDefinition[] = [
  {
    id: 'front',
    name: 'Front View',
    instruction: 'Frame handlebar, front headlight, fork, and front tire within the center guides.',
    mandatory: true,
    silhouette: 'front'
  },
  {
    id: 'rear',
    name: 'Rear View',
    instruction: 'Capture the rear tail lamp, license/reflector, rear fender, and tire.',
    mandatory: true,
    silhouette: 'rear'
  },
  {
    id: 'left',
    name: 'Left Side View',
    instruction: 'Capture the entire left profile from 1.5m away. Ensure frame and kickstand are visible.',
    mandatory: true,
    silhouette: 'left'
  },
  {
    id: 'right',
    name: 'Right Side View',
    instruction: 'Capture the right drive side including pedals, motor casing, and chain drive.',
    mandatory: true,
    silhouette: 'right'
  },
  {
    id: 'damage_closeup',
    name: 'Damage Close-up (Optional)',
    instruction: 'If any pre-existing scratches or dents are observed, capture a macro close-up view.',
    mandatory: false,
    silhouette: 'closeup'
  }
];

export const MANDATORY_VIEW_IDS = CAMERA_VIEWS.filter(v => v.mandatory).map(v => v.id);
