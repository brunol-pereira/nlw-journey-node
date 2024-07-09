import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import dayjs from "dayjs"
import { z } from "zod";
import { prisma } from "../lib/prisma";
import {getMailClient } from "../lib/mail";
import nodemailer from "nodemailer";

export async function createTrip(app: FastifyInstance){
    app.withTypeProvider<ZodTypeProvider>().post('/trips',{
        schema: {
            body: z.object({
                destiantion: z.string().min(4),
                starts_at: z.coerce.date(),
                ends_at:z.coerce.date(),
                owner_name: z.string(),
                owner_email: z.string().email(),

            })
        },
    } , async (request) => {
        const {destiantion, starts_at, ends_at, owner_name, owner_email} = request.body

        if (dayjs(starts_at).isBefore(new Date())){
            throw new Error('Invalid trip start date')
        }

        if (dayjs(ends_at).isBefore(starts_at)) {
            throw new Error('Invalid trip end date')
        }

        const trip = await prisma.trip.create({
            
            data: {
                destiantion,
                starts_at,
                ends_at
            }
        })

        const mail = await getMailClient()

        const message = await mail.sendMail({
            from: {
                name: 'Equipe plann.er',
                address: 'contato@planner.com'
            },
            to: {
                name: owner_name,
                address: owner_email
            },
            subject: 'Enviando email',
            html: `<p>Teste de envio de email<p/>`
        })

        console.log(nodemailer.getTestMessageUrl(message))

        return {tripId: trip.id
        }
    })
}