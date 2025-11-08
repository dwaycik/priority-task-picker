FROM denoland/deno:latest

WORKDIR /app

# Copy project files
COPY . .

# Install Slack CLI
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash && \
    ln -s /root/.slack/bin/slack /usr/local/bin/slack-cli

CMD ["slack-cli", "run"]
