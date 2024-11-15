pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                script {
                    sh 'docker build -t midi-gen .'
                }
            }
        }

        stage('Run') {
            steps { 
                script {
                    sh 'docker ps -qa --filter "name=midi-gen" | grep -q . && docker stop midi-gen && docker rm midi-gen || true'
                    sh 'docker run --name midi-gen -e CHECKPOINT_PATH=/volume/checkpoint.pt -v /home/eri/midi-gen-volume:/volume -p 8010:8010 --gpus all --rm -d midi-gen' 
                }
            }
        }
    }
}

