pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                script {
                    // Build Docker image
                    sh 'docker build -t midi-gen .'
                }
            }
        }

        stage('Run') {
            steps {
                script {
                    // Stop existing container if running
                    sh 'docker ps -q --filter "name=midi-gen" | grep -q . && docker stop midi-gen && docker rm midi-gen || true'
                    
                    // Run new container
                    sh 'docker run -d --name midi-gen midi-gen -p 8010:8010'
                }
            }
        }
    }

    post {
        failure {
            echo 'Pipeline failed! Check logs for details.'
        }
        success {
            echo 'Pipeline completed successfully!'
        }
    }
}

