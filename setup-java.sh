#!/bin/bash
# Script para configurar JAVA_HOME automaticamente

# Tentar encontrar Java instalado
JAVA_PATH=$(update-alternatives --list java 2>/dev/null | head -1)

if [ -z "$JAVA_PATH" ]; then
    JAVA_PATH=$(which java 2>/dev/null)
fi

if [ -z "$JAVA_PATH" ]; then
    # Tentar localizações comuns
    if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
        JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    elif [ -d "/usr/lib/jvm/java-11-openjdk-amd64" ]; then
        JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64"
else
    echo "Java não encontrado. Instale com: sudo apt install openjdk-17-jdk"
        exit 1
    fi
else
    JAVA_HOME=$(dirname $(dirname "$JAVA_PATH"))
fi

export JAVA_HOME
export PATH=$PATH:$JAVA_HOME/bin

echo "JAVA_HOME configurado: $JAVA_HOME"
echo "Execute: npm run android:build"
