package com.darkowl.tuition.platform;

import java.net.URI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

@Configuration
class S3Configuration {

  @Bean
  S3Client s3Client(S3Properties s3) {
    S3ClientBuilder builder = S3Client.builder().forcePathStyle(s3.pathStyleAccess());
    if (s3.endpoint() != null && !s3.endpoint().isBlank()) {
      builder = builder.endpointOverride(URI.create(s3.endpoint()));
    }
    return builder.build();
  }
}
