# The AWS Emulator publishes no image, so one is built from its Linux package.
# Always the latest package: the emulator improves week to week (ADR 0002), so
# the version is deliberately not pinned.
FROM public.ecr.aws/amazonlinux/amazonlinux:2023-minimal
ARG TARGETARCH
RUN case "$TARGETARCH" in arm64) a=aarch64 ;; amd64) a=x86_64 ;; *) exit 1 ;; esac \
    && curl -fsSLo /tmp/aws-emulator.rpm \
       "https://downloads.aws.com/aws-emulator/packages/aws-emulator/LTS/latest/aws-emulator-$a.rpm" \
    && rpm -i /tmp/aws-emulator.rpm && rm /tmp/aws-emulator.rpm \
    && mkdir -p /home/emulator && chown 1000 /home/emulator
USER 1000
ENV HOME=/home/emulator
ENV PATH=/opt/aws-emulator/bin:$PATH
EXPOSE 9297
HEALTHCHECK --interval=2s --timeout=3s --retries=30 --start-period=5s \
  CMD curl -sf --cacert /home/emulator/.aws/emulator/9297/ca.pem \
      https://localhost:9297/__admin/health || exit 1
ENTRYPOINT ["aws-emulator", "-b", "0.0.0.0"]
