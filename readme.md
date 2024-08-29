# API de leitura de medidores

Este projeto é uma API REST baseada em Node.js para gerenciar leituras de medidores de água e gás. Ele usa IA para processar imagens de medidores e determinar valores de consumo, salva e libera um link de acesso onde tudo é armazenado em um banco MySQL no Docker.

## Tabela de Conteúdos

- [Pré-requisitos](#prerequisites)
- [Configurar](#setup)
- [Executando o aplicativo](#running-the-application)
- [Variáveis ​​de ambiente](#environment-variables)
- [API Endpoints](#api-endpoints)

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js v18+](https://nodejs.org/) (if running locally)

## Configurar

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/FocusEvenGitHub/meter-reading-api.git
   cd meter-reading-api
2. **Crie um arquivo .env na raiz do projeto e adicione as variáveis ​​de ambiente necessárias. (Consulte a seção Variáveis ​​de ambiente abaixo.)**

3. **Crie e inicie o aplicativo usando o Docker Compose:**

        docker-compose up --build
    Isso iniciará o aplicativo e o banco de dados MySQL.

## Executando o aplicativo
Para executar o aplicativo, use o seguinte comando:
    
    docker-compose up
O projeto estará acessível em http://localhost:3000.

## Executando localmente (sem Docker)
Se você preferir executar o aplicativo sem Docker:

1. Instalar dependências:
    ```bash
    npm install
2. Crie o código TypeScript:
    ```bash
    npm run build
3. Inicie o aplicativo:
    ```bash
    npm start
## Variáveis ​​de ambiente
Crie um arquivo .env no diretório raiz e adicione as seguintes variáveis ​​de ambiente:
    
    GEMINI_API_KEY=<your_gemini_api_key>

    # Configurações do ambiente Node.js
    NODE_ENV=production
    PORT=3000

    # Configurações do banco de dados
    DB_HOST=db
    DB_PORT=3306
    DB_USER=api
    DB_PASS=123
    DB_NAME=db

## API Endpoints
- ### POST /upload: 
    * Validar o tipo de dados dos parâmetros enviados (inclusive o base64)
    * Verificar se já existe uma leitura no mês naquele tipo de leitura.
    * Integrar com uma API de LLM para extrair o valor da imagem
    
    #### Ela irá retornar:
    * Um link temporário para a imagem
    * Um GUID
    * O valor numérico reconhecido pela LLM


- ### PATCH /confirm:
    - Validar o tipo de dados dos parâmetros enviados
    - Verificar se o código de leitura informado existe
    - Verificar se o código de leitura já foi confirmado
    - Salvar no banco de dados o novo valor informado
    
    #### Ela irá retornar:
    - Resposta de OK ou ERRO dependendo do valor informado.
- ### GET /<customer_code>/list
    - Receber o código do cliente e filtrar as medidas realizadas por ele
    - Ele opcionalmente pode receber um query parameter “measure_type”, que
    deve ser “WATER” ou “GAS”
    - A validação deve ser CASE INSENSITIVE
    - Se o parâmetro for informado, filtrar apenas os valores do tipo
    especificado. Senão, retornar todos os tipos.
    
    Ex. http://localhost:3000/1/list?measure_type=WATER
    #### Ela irá retornar:
    -  Uma lista com todas as leituras realizadas.
