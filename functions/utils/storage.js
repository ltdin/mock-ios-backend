function buildDownloadUrl(bucketName, filePath, token) {
  const isEmulator = !!process.env.FIREBASE_STORAGE_EMULATOR_HOST;
  const base = isEmulator
    ? `http://${process.env.FIREBASE_STORAGE_EMULATOR_HOST}/v0/b/${bucketName}/o/`
    : `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/`;
  return `${base}${encodeURIComponent(filePath)}?alt=media&token=${token}`;
}

module.exports = { buildDownloadUrl };
