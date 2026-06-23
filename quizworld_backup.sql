-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: quizworld
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quiz_id` int NOT NULL,
  `question` text NOT NULL,
  `options` json NOT NULL,
  `correct_answer` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=69 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (29,6,'What is the main function of the skin in the human body?','[\"To digest food\", \"To breathe\", \"To protect the body\", \"To produce blood\"]',2),(30,6,'Which part of the body helps us to see?','[\"Ears\", \"Nose\", \"Eyes\", \"Mouth\"]',2),(31,6,'What is the largest organ in the human body?','[\"Brain\", \"Heart\", \"Liver\", \"Skin\"]',3),(32,6,'Which part of the body helps us to hear?','[\"Eyes\", \"Nose\", \"Mouth\", \"Ears\"]',3),(33,6,'What is the function of the skeleton in the human body?','[\"To produce blood\", \"To digest food\", \"To protect internal organs\", \"To breathe\"]',2),(34,7,'What is a desktop?','[\"A type of laptop\", \"A type of computer\", \"A type of phone\", \"A type of tablet\"]',1),(35,7,'What is the main function of a desktop computer?','[\"To make phone calls\", \"To send emails\", \"To perform various tasks and run software\", \"To watch TV\"]',2),(36,7,'What is typically found on a desktop?','[\"A keyboard and mouse\", \"A TV and radio\", \"A phone and tablet\", \"A laptop and camera\"]',0),(37,7,'What type of computer is designed to be used in one location?','[\"Laptop\", \"Desktop\", \"Tablet\", \"Smartphone\"]',1),(38,7,'What is a common use for a desktop computer?','[\"Gaming\", \"Watching movies\", \"Browsing the internet\", \"All of the above\"]',3),(39,7,'What is usually connected to a desktop computer?','[\"A phone\", \"A tablet\", \"A monitor, keyboard, and mouse\", \"A TV\"]',2),(40,7,'What is an advantage of a desktop computer?','[\"Portability\", \"Ease of use\", \"Customization and upgradability\", \"Affordability\"]',2),(41,7,'What is a common component of a desktop computer?','[\"Battery\", \"Touchscreen\", \"CPU and motherboard\", \"Camera\"]',2),(42,7,'What is a desktop computer often used for in businesses?','[\"Communication\", \"Entertainment\", \"Productivity and work tasks\", \"Storage\"]',2),(43,7,'What is a benefit of using a desktop computer?','[\"It is lightweight\", \"It is easy to carry\", \"It can be easily customized and upgraded\", \"It is only used for gaming\"]',2),(44,8,'What is the primary function of a desktop?','[\"To provide a platform for mobile devices\", \"To serve as a server for networks\", \"To provide a user interface for computer users\", \"To store data for backup purposes\"]',2),(45,8,'Which of the following is a common component of a desktop computer?','[\"Keyboard\", \"Mouse\", \"Monitor\", \"All of the above\"]',3),(46,8,'What is the term for the background image or pattern on a desktop?','[\"Wallpaper\", \"Screensaver\", \"Desktop theme\", \"Background image\"]',0),(47,8,'Which operating system is commonly used on desktop computers?','[\"Android\", \"iOS\", \"Windows\", \"Linux\"]',2),(48,8,'What is the purpose of a desktop icon?','[\"To display system information\", \"To provide a shortcut to a program or file\", \"To change the desktop background\", \"To adjust system settings\"]',1),(49,8,'How do you typically interact with a desktop computer?','[\"Using voice commands\", \"Using a touch screen\", \"Using a keyboard and mouse\", \"Using a game controller\"]',2),(50,8,'What is a desktop widget?','[\"A small program that runs on the desktop\", \"A type of virus that infects desktops\", \"A way to customize the desktop background\", \"A type of hardware component\"]',0),(51,8,'Which of the following is a benefit of using a desktop computer?','[\"Portability\", \"Ease of use\", \"High processing power\", \"Low cost\"]',2),(52,8,'What is the term for the process of customizing the appearance and behavior of a desktop?','[\"Personalization\", \"Configuration\", \"Customization\", \"Themeing\"]',0),(53,8,'Which of the following is a common use for a desktop computer?','[\"Gaming\", \"Video editing\", \"Web browsing\", \"All of the above\"]',3),(54,9,'What does CPU stand for?','[\"Central Power Unit\", \"Central Processing Unit\", \"Central Performance Unit\", \"Central Processor Unit\"]',1),(55,9,'What is the primary function of a CPU?','[\"To store data\", \"To provide power to the computer\", \"To process information\", \"To connect peripherals\"]',2),(56,9,'Which of the following is a type of CPU?','[\"Hard Drive\", \"RAM\", \"Microprocessor\", \"Power Supply\"]',2),(57,9,'What is the control unit responsible for in a CPU?','[\"Executing instructions\", \"Storing data\", \"Controlling input/output operations\", \"Managing memory\"]',0),(58,9,'What is the purpose of the Arithmetic Logic Unit (ALU) in a CPU?','[\"To store data\", \"To control input/output operations\", \"To perform mathematical and logical operations\", \"To manage memory\"]',2),(59,9,'How many cores does a single-core CPU have?','[\"1\", \"2\", \"4\", \"8\"]',0),(60,9,'What is hyper-threading in a CPU?','[\"A technology that increases the number of cores\", \"A technology that increases the clock speed\", \"A technology that allows multiple threads to run on a single core\", \"A technology that reduces power consumption\"]',2),(61,9,'What is the clock speed of a CPU measured in?','[\"Bytes per second\", \"Bits per second\", \"Hertz (Hz)\", \"Megabytes per second\"]',2),(62,9,'What is overclocking in a CPU?','[\"Running the CPU at a lower clock speed\", \"Running the CPU at a higher clock speed than recommended\", \"Increasing the number of cores\", \"Decreasing the power consumption\"]',1),(63,9,'What can happen if a CPU is overclocked too much?','[\"It will run faster and more efficiently\", \"It will consume less power\", \"It will generate less heat\", \"It can overheat and be damaged\"]',3),(64,10,'What is the time complexity of a linear search algorithm?','[\"O(1)\", \"O(log n)\", \"O(n)\", \"O(n log n)\"]',2),(65,10,'Which of the following has a time complexity of O(n log n)?','[\"Bubble sort\", \"Merge sort\", \"Linear search\", \"Binary search\"]',1),(66,10,'What is the time complexity of accessing an element in an array by its index?','[\"O(1)\", \"O(log n)\", \"O(n)\", \"O(n log n)\"]',0),(67,10,'What is the time complexity of a binary search algorithm?','[\"O(1)\", \"O(log n)\", \"O(n)\", \"O(n log n)\"]',1),(68,10,'Which of the following sorting algorithms has a time complexity of O(n^2)?','[\"Quick sort\", \"Merge sort\", \"Bubble sort\", \"Heap sort\"]',2);
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quizzes`
--

DROP TABLE IF EXISTS `quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quizzes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `difficulty` varchar(50) NOT NULL,
  `total_questions` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quizzes`
--

LOCK TABLES `quizzes` WRITE;
/*!40000 ALTER TABLE `quizzes` DISABLE KEYS */;
INSERT INTO `quizzes` VALUES (6,'BODY','Science','Easy',5,'2026-06-20 05:50:38'),(7,'desktop','Computer','Easy',10,'2026-06-20 06:03:44'),(8,'desktop','Computer','Medium',10,'2026-06-20 06:04:00'),(9,'cpu','Computer','Easy',10,'2026-06-20 06:04:17'),(10,'time complexity','Computer','Easy',5,'2026-06-20 06:18:03');
/*!40000 ALTER TABLE `quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `results`
--

DROP TABLE IF EXISTS `results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `quiz_id` int NOT NULL,
  `score` int NOT NULL,
  `total` int NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `results_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `results_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `results`
--

LOCK TABLES `results` WRITE;
/*!40000 ALTER TABLE `results` DISABLE KEYS */;
INSERT INTO `results` VALUES (1,1,6,0,5,0.00,'2026-06-20 05:51:27'),(2,1,6,0,5,0.00,'2026-06-20 05:52:04'),(3,1,9,3,10,30.00,'2026-06-20 06:06:01'),(4,1,9,3,10,30.00,'2026-06-20 06:06:30'),(5,2,10,2,5,40.00,'2026-06-20 06:21:52'),(6,2,10,2,5,40.00,'2026-06-20 06:22:21');
/*!40000 ALTER TABLE `results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Abhimanyu Kumar','mrabhi962005@gmail.com','$2b$10$JecVtDn6kqZsJL9uyiYCZ.W5Y2Q/pGOweroORWh50wdtRpJm/BfWi','2026-06-19 16:22:49'),(2,'abhi','mkmanu0102@gmail.com','$2b$10$yduxY0hVFcTGcJAQ30WdXOOtCKKHiOLzhRhx.JA.OWGKZICbTmNg2','2026-06-20 06:20:39');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-22 20:15:39
