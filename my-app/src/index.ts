import { Hono } from 'hono'
import {streamSSE} from 'hono/streaming'
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

const aggregates=new Map<string,{src:string;dst:string;count:number;lastSeen:number}>()


function addAttack(attack:{src:string;dst:string}){
  const key=`${attack.src}-${attack.dst}`
  const existing= aggregates.get(key)
  if(existing){
    existing.count++
    existing.lastSeen=Date.now()
  }else{
    aggregates.set(key,{src:attack.src,dst:attack.dst,count:1,lastSeen:Date.now()})
  }
}



function flushAggregates(){
  const data=Array.from(aggregates.values())
  aggregates.clear()
  return data
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
        for(let i=0;i<5;i++){
          const attack=randomAttack()
          addAttack({src:attack.src,dst:attack.dst})
          await stream.sleep(1000)
      }
      const summary=flushAggregates()
      await stream.writeSSE({
        event:"summary",
        data:JSON.stringify(summary)
      })

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
