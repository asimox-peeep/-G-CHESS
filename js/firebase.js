/* Firebase is intentionally inactive until the owner configures a Firebase project.
 * Do not put Admin SDK credentials or private keys in browser code. */
window.gChessFirebase = {
  ready: false,
  message: 'Firebase is not configured. Local chess remains available.',
  getAuth: () => null,
  getFirestore: () => null
};
