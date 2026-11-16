#!/usr/bin/env node
/**
 * One-time setup (and password change) for the studio admin at /admin.
 *
 *   cd apps/website && npm run admin:setup
 *
 * Asks for a password and the Supabase secret key (typing is hidden), then
 * saves to Vercel (production) and to .env.local:
 *   ADMIN_PASSWORD_HASH   scrypt hash of the password (never the password)
 *   ADMIN_SESSION_SECRET  new random secret, so every browser is signed out
 *   SUPABASE_SECRET_KEY   only if you paste one
 * Needs the Vercel CLI, logged in and linked to the studio-npv project.
 */
import { randomBytes, scryptSync } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const stdin = process.stdin
    process.stdout.write(question)
    let value = ''
    stdin.setEncoding('utf8')
    if (stdin.isTTY) stdin.setRawMode(true)
    stdin.resume()
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.off('data', onData)
          if (stdin.isTTY) stdin.setRawMode(false)
          stdin.pause()
          process.stdout.write('\n')
          return resolve(value.trim())
        }
        if (ch === '\u0003') {
          process.stdout.write('\n')
          process.exit(1)
        }
        if (ch === '\u007f' || ch === '\b') {
          if (value.length) {
            value = value.slice(0, -1)
            if (!hidden) process.stdout.write('\b \b')
          }
          continue
        }
        value += ch
        process.stdout.write(hidden ? '' : ch)
      }
    }
    stdin.on('data', onData)
  })
}

function vercelEnvAdd(name, value) {
  const res = spawnSync('vercel', ['env', 'add', name, 'production', '--force', '--sensitive', '--yes'], {
    input: value,
    encoding: 'utf8',
  })
  if (res.status !== 0) {
    console.error(`\nCouldn't save ${name} to Vercel:\n${res.stderr || res.stdout}`)
    process.exit(1)
  }
  console.log(`  ✓ ${name} saved to Vercel`)
}

function setLocal(vars) {
  const file = path.join(root, '.env.local')
  let text = existsSync(file) ? readFileSync(file, 'utf8') : ''
  for (const [k, v] of Object.entries(vars)) {
    const line = `${k}=${v}`
    const re = new RegExp(`^${k}=.*$`, 'm')
    text = re.test(text) ? text.replace(re, line) : `${text.replace(/\n?$/, '\n')}${line}\n`
  }
  writeFileSync(file, text)
  console.log('  ✓ .env.local updated (this Mac only, never committed)')
}

console.log('\nStudio admin setup\n')

if (spawnSync('vercel', ['--version'], { encoding: 'utf8' }).status !== 0) {
  console.error('The Vercel CLI is not installed. Run: npm i -g vercel, then vercel login.')
  process.exit(1)
}
if (!existsSync(path.join(root, '.vercel', 'project.json'))) {
  console.error('This folder is not linked to Vercel. Run: vercel link (pick the studio-npv project).')
  process.exit(1)
}

let password = ''
for (;;) {
  password = await ask('Choose a password (at least 12 characters, typing is hidden): ', { hidden: true })
  if (password.length < 12) {
    console.log('  Too short. Use at least 12 characters; a few random words works well.')
    continue
  }
  const again = await ask('Type it again: ', { hidden: true })
  if (again !== password) {
    console.log("  They didn't match. Try again.")
    continue
  }
  break
}

console.log('\nSupabase secret key: Supabase → your project → Project Settings → API Keys →')
console.log('"Secret keys" → copy the key (starts with sb_secret_).')
let secret = ''
for (;;) {
  secret = await ask('Paste it here (hidden), or press Enter to keep the one already saved: ', { hidden: true })
  if (!secret || secret.startsWith('sb_secret_') || secret.startsWith('eyJ')) break
  console.log("  That doesn't look like a secret key. It should start with sb_secret_. (Not the publishable key.)")
}

const salt = randomBytes(16)
const hash = `scrypt.${salt.toString('base64url')}.${scryptSync(password, salt, 64).toString('base64url')}`
const session = randomBytes(48).toString('base64url')

console.log('\nSaving…')
vercelEnvAdd('ADMIN_PASSWORD_HASH', hash)
vercelEnvAdd('ADMIN_SESSION_SECRET', session)
if (secret) vercelEnvAdd('SUPABASE_SECRET_KEY', secret)
setLocal({ ADMIN_PASSWORD_HASH: hash, ADMIN_SESSION_SECRET: session, ...(secret ? { SUPABASE_SECRET_KEY: secret } : {}) })

console.log('\nDone. The live site picks this up on its next deploy.')
console.log('Tell Claude "admin setup done", or redeploy yourself: Vercel → studio-npv → Deployments →')
console.log('the top one → ⋯ → Redeploy.\n')
