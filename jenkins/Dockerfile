FROM jenkins/jenkins:latest

USER root

ARG DOCKER_GID=999

ENV MAVEN_RELEASE=3 \
    MAVEN_VERSION=3.9.9 \
    MAVEN_HOME=/opt/maven

# Layer 1: System tools
RUN apt-get update && \
    apt-get install -y ca-certificates curl wget gnupg2 lsb-release && \
    apt-get clean

# Layer 2: Docker GPG key
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc && \
    chmod a+r /etc/apt/keyrings/docker.asc

# Layer 3: Docker repository
RUN echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list && apt-get update

# Layer 4: Docker CLI + Compose plugin
RUN apt-get install -y docker-ce-cli docker-compose-plugin && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Layer 5: Maven
RUN wget --no-verbose \
    https://downloads.apache.org/maven/maven-${MAVEN_RELEASE}/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz \
    -P /tmp/ && \
    tar xzf /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz -C /opt/ && \
    ln -s /opt/apache-maven-${MAVEN_VERSION} /opt/maven && \
    ln -s /opt/maven/bin/mvn /usr/local/bin/mvn && \
    rm /tmp/apache-maven-${MAVEN_VERSION}-bin.tar.gz

# Layer 6: Maven permissions + Docker socket access
RUN chown -R jenkins:jenkins /opt/maven && \
    groupadd -g ${DOCKER_GID} docker 2>/dev/null || true && \
    usermod -aG docker jenkins && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

USER jenkins

ENV PATH="${MAVEN_HOME}/bin:${PATH}"
