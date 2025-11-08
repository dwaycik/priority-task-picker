FROM denoland/deno:latest

WORKDIR /app

# Copy project files
COPY . .

# Install Slack CLI
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://downloads.slack-edge.com/slack-cli/install.sh | bash && \
    ln -s /root/.slack/bin/slack /usr/local/bin/slack-cli

# Create startup script
RUN echo '#!/bin/bash\n\
mkdir -p /root/.slack\n\
echo "$SLACK_CREDENTIALS" > /root/.slack/credentials.json\n\
slack-cli run' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
