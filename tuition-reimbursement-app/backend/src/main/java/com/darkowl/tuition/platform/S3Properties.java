package com.darkowl.tuition.platform;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Where Supporting Documents are stored. The endpoint is configuration (ADR 0002)
 * so the same build talks to the AWS Emulator locally and to S3 in AWS: blank
 * means real S3 at the SDK's own endpoint for the Region.
 *
 * @param endpoint the S3 endpoint to call, blank for real S3
 * @param documentsBucket the bucket Supporting Documents live in
 * @param pathStyleAccess whether to address the bucket in the path, which the emulator needs
 */
@ConfigurationProperties(prefix = "app.s3")
public record S3Properties(String endpoint, String documentsBucket, boolean pathStyleAccess) {}
