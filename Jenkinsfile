pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh '''build_name=jenkins/${PROJECT_NAME}:${BRANCH_NAME}-${BUILD_NUMBER}

docker build \\
  -t ${build_name} \\
  .'''
      }
    }

    stage('Deploy') {
      parallel {
        stage('main') {
          when {
            branch 'main'
          }
          steps {
            withCredentials(bindings: [
                                          string(credentialsId: 'kk_mongodb_url', variable: 'MONGODB_URL'),
                                          string(credentialsId: 'openai_api_key', variable: 'OPENAI_API_KEY'),
                                          string(credentialsId: 'dc-subbot-discord_bot_token', variable: 'DISCORD_BOT_TOKEN')
                                        ]) {
                sh '''run_name=jk-${PROJECT_NAME}-${BRANCH_NAME}
build_name=jenkins/${PROJECT_NAME}:${BRANCH_NAME}-${BUILD_NUMBER}

docker rm -f ${run_name}
docker run \\
  -d \\
  --restart=unless-stopped \\
  --name ${run_name} \\
  -e NODE_ENV="production" \\
  -e DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN} \\
  -e MONGODB_URL=${MONGODB_URL} \\
  ${build_name}'''
              }

            }
          }

        }
      }

      stage('Test') {
        steps {
          sh 'echo Not test yet!'
        }
      }

    }
    environment {
      PROJECT_NAME = 'dc-subbot'
    }
    post {
      success {
        library 'shared-library'
        discord_notifaction true
      }

      unsuccessful {
        library 'shared-library'
        discord_notifaction false
      }

    }
  }