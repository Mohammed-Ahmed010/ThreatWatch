import { Hono } from 'hono'
import {streamSSE} from 'hono/streaming'
import { hanldeAttack } from './redis'


const app = new Hono()
const countries = ["US", "CN", "RU", "IN", "DE", "BR", "FR", "GB", "JP", "AU"]


function randomAttack(){
  let src=countries[Math.floor(Math.random()*countries.length)]
  const dst=countries[Math.floor(Math.random()*countries.length)]
  if (src==dst){
    src='BG'
  }
  return {
    id:crypto.randomUUID(),
    src,
    dst,
    asn:Math.floor(Math.random()*99999),
    size:Math.floor(Math.random()*5000)+500,
    t:new Date().toISOString()
  }
}


app.get('/', (c) => {
  return c.text('Hello Hono!')
})

let id = 0

app.get("/health", (c) => {
  return c.json({ ok: true })
}) 

app.get("/events",(c)=>{
      c.header('Cache-control','no-cache')
      c.header('Connection','keep-alive')
      c.header('X-Accel-Buffering','no')
      return streamSSE(c,async(stream)=>{
          while(true){    
            const attack=randomAttack()
            await hanldeAttack({src:attack.src,dst:attack.dst})

            await stream.writeSSE({
              event: "attack",
              data: JSON.stringify(attack),
             })
            await stream.sleep(2000)
          }
     

      })
})



app.get('/sse', async (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      const message = `It is ${new Date().toISOString()}`
      await stream.writeSSE({
        data: message,
        event: 'time-update',
        id: String(id++),
      })
      await stream.sleep(1000)
    }
  })
})
export default app
