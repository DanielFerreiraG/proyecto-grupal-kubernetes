pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_USER        = "${DOCKERHUB_CREDENTIALS_USR}"
        BACKEND_IMAGE         = "${DOCKERHUB_CREDENTIALS_USR}/pizza-corrida-api"
        FRONTEND_IMAGE        = "${DOCKERHUB_CREDENTIALS_USR}/pizza-corrida-frontend"
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/DanielFerreiraG/proyecto-grupal-kubernetes.git'
            }
        }

        stage('Build & Push') {
            parallel {

                stage('Backend') {
                    stages {

                        stage('Compile Backend') {
                            steps {
                                dir('backend') {
                                    sh 'mvn package -DskipTests -q'
                                }
                            }
                        }

                        stage('Build Backend Image') {
                            steps {
                                dir('backend') {
                                    sh "docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} -t ${BACKEND_IMAGE}:latest ."
                                }
                            }
                        }

                        stage('Push Backend Image') {
                            steps {
                                sh """
                                    echo "${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "${DOCKERHUB_CREDENTIALS_USR}" --password-stdin
                                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                                    docker push ${BACKEND_IMAGE}:latest
                                """
                            }
                        }
                    }
                }

                stage('Frontend') {
                    stages {

                        stage('Build Frontend Image') {
                            steps {
                                dir('frontend') {
                                    sh "docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} -t ${FRONTEND_IMAGE}:latest ."
                                }
                            }
                        }

                        stage('Push Frontend Image') {
                            steps {
                                sh """
                                    echo "${DOCKERHUB_CREDENTIALS_PSW}" | docker login -u "${DOCKERHUB_CREDENTIALS_USR}" --password-stdin
                                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                                    docker push ${FRONTEND_IMAGE}:latest
                                """
                            }
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            sh """
                docker rmi ${BACKEND_IMAGE}:${IMAGE_TAG}  || true
                docker rmi ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
            """
        }
        success {
            echo "Imagenes publicadas: ${BACKEND_IMAGE}:${IMAGE_TAG} y ${FRONTEND_IMAGE}:${IMAGE_TAG}"
        }
        failure {
            echo 'El pipeline fallo. Revisa los logs de cada stage.'
        }
    }
}