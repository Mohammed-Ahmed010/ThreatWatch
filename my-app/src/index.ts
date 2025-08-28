import { Hono } from 'hono'
import {streamSSE} from 'hono/streaming'
import { hanldeAttack,flushAggregatesRedis, redis } from './redis'


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


app.get('/', async(c) => {
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
            await stream.sleep(1000)
          }
     

      })

})
app.get("/stream",async(c)=>{
const stream= new ReadableStream({
  async start(controller){
    setInterval(async() => {
     const keys = await redis.keys("attacks:*")
     const values=await Promise.all(keys.map(k=>redis.get(k)))
      
      const data:Record<string,number>={}
      keys.forEach((key,i)=>{
        data[key]=values[i]? Number(values[i]):0
      })

      const text= `data: ${JSON.stringify(data)}\n\n`
      controller.enqueue(
       new TextEncoder().encode(text)
      )
    }, 2000);
  }
})
return new Response(stream,{
  headers:{ "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",}
})
 

})

app.get("/checking",async(c)=>{
  return streamSSE(c,async(stream)=>{
    while(true){
      await stream.sleep(5000)
      const values=flushAggregatesRedis()
      await stream.writeSSE({
        event:'JSON',
        data:JSON.stringify(values)
      })
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
