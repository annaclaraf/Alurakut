import { SiteClient } from 'datocms-client';

export default async function recebedorDeRequests(request, response) {
    if(request.method === 'POST'){
        const token = 'ae0a26d03ec7776a041899b7d577ed'
        const client = new SiteClient(token)

        const registroCriado = await client.items.create({
            itemType: '967567', //id do modal de comunidades criado pelo dato
            ...request.body

            // title: 'Comunidade',
            // imageUrl: 'https://github.com/annaclaraf.png',
            // creatorSlug: 'annaclaraf'

        })

        response.json({
            dados: 'Algum dado qualquer',
            registroCriado: registroCriado,
        })
        return;
    }

    response.status(400).json({
        message: 'Ainda não temos nada no GET'
    })
}