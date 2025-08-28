import { PrismaClient } from "@prisma/client";


export const prisma=new PrismaClient()


export async function saveToDb(attacks:string[]){
    for( const attack of attacks ){
        // await prisma.attackAggregate.create({
        //     // data:{
        //     //     src:attack.src
        //     // }
        // })
    }
}