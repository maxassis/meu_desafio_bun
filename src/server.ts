import { app } from './app'

const port = Number(process.env.PORT)

app.listen(port)

console.log(`Elysia is running in port ${port}`)
