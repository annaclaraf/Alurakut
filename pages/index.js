import React from 'react'
import nookies from 'nookies'
import jwt from 'jsonwebtoken'
import MainGrid from '../src/components/MainGrid'
import Box from '../src/components/Box'
import { ProfileRelationsBoxWrapper } from '../src/components/ProfileRelations'
import { AlurakutMenu, OrkutNostalgicIconSet, AlurakutProfileSidebarMenuDefault } from '../src/lib/AlurakutCommons'

function ProfileSidebar(propriedades){
  return (
    <Box as="aside">
      <img src={`https://github.com/${propriedades.githubUser}.png`} style={{ borderRadius: '8px' }}/>

      <hr/>

      <p>
        <a className="boxLink" href={`https://github.com/${propriedades.githubUser}`} target="_blank">
          @{propriedades.githubUser}
        </a>
      </p>

      <hr/>

      <AlurakutProfileSidebarMenuDefault/>
    </Box>
  )
}

function ProfileRelationsBox(propriedades){
  return (
    <ProfileRelationsBoxWrapper>
      <h2 className="smallTitle">{propriedades.title} ({propriedades.items.length})</h2>

      <ul>
      {propriedades.items.slice(0, 6).map((itemAtual) => {
        return (
          <li key={itemAtual.id}>
            <a href={`/user/${itemAtual.login}`}>
              <img src={`https://github.com/${itemAtual.login}.png`}/>
              <span>{itemAtual.login}</span>
            </a>
          </li>
        )
      })}
      </ul>
    </ProfileRelationsBoxWrapper>
  )
}

export default function Home(props) {
  const githubUser = props.githubUser;

  const [comunidades, setComunidades] = React.useState([])

  const [seguidores, setSeguidores] = React.useState([])

  const [seguindo, setSeguindo] = React.useState([])

  React.useEffect(() => {
    //API github
    //seguidores
    fetch(`https://api.github.com/users/${githubUser}/followers`)
    .then((respostaDoServidor) => {
      return respostaDoServidor.json();
    })
    .then((respostaCompleta) => {
      setSeguidores(respostaCompleta);
    });

    //seguindo
    fetch(`https://api.github.com/users/${githubUser}/following`)
    .then((respostaDoServidor) => {
      return respostaDoServidor.json();
    })
    .then((respostaCompleta) => {
      setSeguindo(respostaCompleta);
    });

    //API datocms graphQL
    fetch('https://graphql.datocms.com/', { 
      method: 'POST',
      headers: {
        'Authorization': 'd92b4f65701c587fa3cf2f33286d0a',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ "query": `query {
        allCommunities {
          id 
          title
          imageUrl
          creatorSlug
        }
      }` 
      })
    })
    .then((response) => response.json()) 
    .then((respostaCompleta) => {
      const comunidadesVindasDoDato = respostaCompleta.data.allCommunities;
      setComunidades(comunidadesVindasDoDato)
    })
  }, [])

  return (
    <>
      <AlurakutMenu githubUser={githubUser}/>

      <MainGrid>
        <div className="profileArea" style={{ gridArea: 'profileArea'}}>
          <ProfileSidebar githubUser={githubUser}/>
        </div>

        <div className="welcomeArea" style={{ gridArea: 'welcomeArea'}}>
          <Box>
            <h1 className="title">
              Bem-vindo(a)
            </h1>

            <OrkutNostalgicIconSet recados = {15} fotos={37} videos={5} fas={seguidores.length} mensagens={7}/>
          </Box>

          <Box>
            <h2 className="subTitle">O que voc?? deseja fazer?</h2>

            <form onSubmit={ function handleCriaComunidade(e){
              e.preventDefault()

              const dadosDoForm = new FormData(e.target)

              const comunidade = {
                title: dadosDoForm.get('title'),
                imageUrl: dadosDoForm.get('image') || `https://picsum.photos/300?${new Date()}`,
                creatorSlug: githubUser
              }

              fetch('/api/comunidades', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',

                },
                body: JSON.stringify(comunidade)
              })
              .then(async (response) => {
                const dados = await response.json()

                const comunidade = dados.registroCriado

                const comunidadesAtualizadas = [...comunidades, comunidade]
                setComunidades(comunidadesAtualizadas)

              })


            }}>
              <div>
                <input type="text" placeholder="Qual vai ser o nome da sua comunidade?" name="title" aria-label="Qual vai ser o nome da sua comunidade?" />
              </div>

              <div>
                <input type="text" placeholder="Coloque uma URL para usarmos de capa" name="image" aria-label="Coloque uma URL para usarmos de capa" />
              </div>

              <button>
                Criar Comunidade
              </button>
            </form>
          </Box>
        </div>

        <div className="profileRelationsArea" style={{ gridArea: 'profileRelationsArea'}}>
          <ProfileRelationsBox title='Seguidores' items={seguidores}/>
          <ProfileRelationsBox title='Seguindo' items={seguindo}/>
          <ProfileRelationsBoxWrapper>
            <h2 className="smallTitle">Comunidades ({comunidades.length})</h2>

            <ul>
              {comunidades.slice(0, 6).map((itemAtual) => {
                return (
                  <li key={itemAtual.id}>
                    <a href={`/comunidades/${itemAtual.id}`}>
                      <img src={itemAtual.imageUrl}/>
                      <span>{itemAtual.title}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </ProfileRelationsBoxWrapper>
        </div>
      </MainGrid>
    </>
  )
}

export async function getServerSideProps(context) {
  const cookies = nookies.get(context);
  const token = cookies.USER_TOKEN;

  const { isAuthenticated } = await fetch('https://alurakut.vercel.app/api/auth', {
    headers: {
      Authorization: token
    }
  })
  .then((resposta) => resposta.json())

  //pegar o token decodificado
  const { githubUser } = jwt.decode(token);

  if (!isAuthenticated) {
    const user = await fetch(`https://api.github.com/users/${githubUser}`)

    if (!user.ok) {
      nookies.destroy(context, 'USER_TOKEN')
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        }
      }
    }
  }

  return {
    props: {
      githubUser
    }
  }
}
