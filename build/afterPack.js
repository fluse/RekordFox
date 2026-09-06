const { execFileSync } = require('child_process')
const path = require('path')

/**
 * electron-builder's own codesign auto-discovery only picks up identities that
 * pass `security find-identity -v -p codesigning` — which requires a trusted
 * certificate chain. Our self-signed cert never passes that check (self-signed
 * roots aren't trusted, and CI builds in a fresh temporary keychain anyway), so
 * electron-builder silently falls back to an ad-hoc signature.
 *
 * codesign itself doesn't require a trusted chain, just the matching private
 * key in an accessible keychain — so we re-sign here manually, overriding
 * whatever electron-builder already applied.
 */
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return

  const identity = process.env.CSC_NAME
  if (!identity) return

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  const entitlements = path.join(context.packager.projectDir, 'build', 'entitlements.mac.plist')

  execFileSync(
    'codesign',
    [
      '--force',
      '--deep',
      '--timestamp=none',
      '--options',
      'runtime',
      '--entitlements',
      entitlements,
      '--sign',
      identity,
      appPath,
    ],
    { stdio: 'inherit' }
  )
}
