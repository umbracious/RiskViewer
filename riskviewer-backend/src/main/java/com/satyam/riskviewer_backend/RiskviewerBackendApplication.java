package com.satyam.riskviewer_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class RiskviewerBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(RiskviewerBackendApplication.class, args);
	}

}
