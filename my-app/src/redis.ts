import Redis from 'ioredis'
import { saveToDb } from './db';


export const redis=new Redis({
    host: "127.0.0.1",
    port: 6379,
  })


export async function hanldeAttack(attack:{src:string;dst:string}){
        await redis.incr(`attacks:${attack.src}:${attack.dst}`)
        await redis.expire(`attacks:${attack.src}:${attack.dst}`,60*3)

        await redis.incr(`attacks:${attack.src}:total`)
        await redis.expire(`attacks:${attack.src}:total`,60*3)

        await redis.incr(`attacks:total`)
        await redis.expire(`attacks:total`,60*3)

        await addAttackRedis(attack)
}

export async function addAttackRedis(attack:{src:string;dst:string}){
        const key=`agg:${attack.src}:${attack.dst}`
        const now=Date.now()
        const existing= await redis.get(key)   
        if(existing){
            const obj=JSON.parse(existing)
            obj.count++
            obj.lastSeen=now
            await redis.set(key,JSON.stringify(obj),"EX",60*3)   
        }else{
            await redis.set(key,JSON.stringify({src:attack.src,dst:attack.dst,count:1,lastSeen:now}),"EX",60*3)
        }
}

export async function flushAggregatesRedis(){
    const keys = await redis.keys("agg:*")
    const values = await Promise.all(keys.map(k => redis.get(k)))
    const data= values.map(v => v ? JSON.parse(v) : null).filter(Boolean)
    await saveToDb(data)
}