import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export { identifyPlant } from './identifyPlant';
export { generateCareSchedule } from './generateCareSchedule';
