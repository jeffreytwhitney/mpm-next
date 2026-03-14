import bcrypt from 'bcryptjs'

const password = process.argv[2]
const roundsArg = process.argv[3]
const rounds = Number.parseInt(roundsArg ?? '', 10)
const saltRounds = Number.isFinite(rounds) ? rounds : 12

if (!password) {
  console.error('Usage: npm run password:hash -- <password> [rounds]')
  process.exit(1)
}

const passwordHash = await bcrypt.hash(password, saltRounds)
console.log(passwordHash)

