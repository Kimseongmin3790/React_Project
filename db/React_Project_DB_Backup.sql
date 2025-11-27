-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: reactsns
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `achievements`
--

DROP TABLE IF EXISTS `achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achievements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `conditions` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achievements`
--

LOCK TABLES `achievements` WRITE;
/*!40000 ALTER TABLE `achievements` DISABLE KEYS */;
/*!40000 ALTER TABLE `achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_message`
--

DROP TABLE IF EXISTS `chat_message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_message` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `room_id` bigint unsigned NOT NULL,
  `sender_id` bigint unsigned NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_chat_message_user` (`sender_id`),
  KEY `idx_room_created` (`room_id`,`created_at`),
  CONSTRAINT `fk_chat_message_room` FOREIGN KEY (`room_id`) REFERENCES `chat_room` (`id`),
  CONSTRAINT `fk_chat_message_user` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_message`
--

LOCK TABLES `chat_message` WRITE;
/*!40000 ALTER TABLE `chat_message` DISABLE KEYS */;
INSERT INTO `chat_message` VALUES (1,1,2,'롤 채팅방 111','2025-11-25 16:32:13'),(2,1,1,'롤 채팅방 222','2025-11-25 16:32:38'),(3,3,1,'ㅁㄴㅇㅁㄴㅇ','2025-11-25 16:33:43'),(4,3,2,'aaa','2025-11-25 16:33:59'),(5,2,2,'오버워치 채팅방 111','2025-11-25 18:02:02'),(6,5,2,'발로란트 채팅방 111','2025-11-25 18:02:08'),(7,1,2,'롤 채팅방 333333','2025-11-25 18:02:14'),(8,6,2,'알림11111','2025-11-25 18:02:27'),(9,6,2,'22222','2025-11-25 18:02:29'),(10,6,2,'33333333','2025-11-25 18:02:31'),(11,1,3,'aaa','2025-11-25 18:02:46'),(12,1,3,'zz','2025-11-25 18:04:48'),(13,1,3,'111','2025-11-25 18:04:56'),(14,2,3,'123','2025-11-25 18:05:17'),(15,2,3,'222','2025-11-25 18:05:25'),(16,2,3,'33434','2025-11-25 18:05:31'),(17,5,3,'2525','2025-11-25 18:05:37'),(18,5,3,'2424','2025-11-25 18:05:43'),(19,1,3,'2233','2025-11-25 18:05:52'),(20,6,3,'444','2025-11-25 18:06:16'),(21,6,2,'555','2025-11-25 18:06:27'),(22,6,2,'safsf','2025-11-25 18:06:32'),(23,5,2,'215251','2025-11-25 18:06:38'),(24,5,2,'5555','2025-11-25 18:07:08'),(25,6,2,'55555','2025-11-25 18:07:31'),(26,1,2,'dddd','2025-11-25 18:07:46'),(27,6,2,'ㅇㅇㅇㅇ','2025-11-25 18:08:53'),(28,6,3,'ㅇㅇㅇㅇ','2025-11-25 18:08:57'),(29,1,2,'ㄱㄱㄱㄱ','2025-11-25 18:09:06'),(30,1,2,'ㅇㅇㅇ','2025-11-25 18:12:51'),(31,2,2,'ㅁㅁㅁ','2025-11-25 18:12:56'),(32,5,2,'ㅇㅇㅇㅇ','2025-11-25 18:12:59'),(33,5,2,'ㅇㅇㅇ','2025-11-25 18:13:09'),(34,3,2,'222','2025-11-25 18:13:20'),(35,3,2,'2424','2025-11-25 18:13:24'),(36,5,2,'ㅁㅁㅁ','2025-11-25 18:13:28'),(37,4,1,'ㅁㅁㅁ','2025-11-25 18:15:35'),(38,6,2,'ㅋㅋㅋㅋ','2025-11-25 18:19:27'),(39,1,3,'zz','2025-11-26 12:38:07'),(40,1,3,'dd','2025-11-26 12:38:14'),(41,6,3,'ㅈㅈㅈㅈ','2025-11-26 12:38:25'),(42,6,2,'1111','2025-11-26 13:15:21'),(43,6,3,'ㅇㅇㅇㅇ','2025-11-26 16:58:57'),(44,6,3,'2222','2025-11-26 16:59:03'),(45,6,3,'4444','2025-11-26 16:59:23'),(46,6,2,'11','2025-11-26 17:03:06'),(47,6,3,'22','2025-11-26 17:03:09'),(48,6,3,'ㅁㅁ','2025-11-26 17:03:59'),(49,6,3,'ㅇㅇㅇ','2025-11-26 17:14:07'),(50,6,3,'ㅁㄴㅇ','2025-11-26 17:14:08'),(51,6,3,'ㅂㅈㄷ','2025-11-26 17:14:09'),(52,6,3,'ㅁㄴㅇ','2025-11-26 17:14:26'),(53,6,3,'ㅈㅂㄱ','2025-11-26 17:14:31'),(54,6,3,'ㅁㄴㅇ','2025-11-26 17:54:18'),(55,1,3,'222','2025-11-26 17:54:24'),(56,1,1,'ㅁㅁㅁ','2025-11-27 16:39:43'),(57,3,2,'111','2025-11-27 16:40:21'),(58,1,2,'222','2025-11-27 17:41:16');
/*!40000 ALTER TABLE `chat_message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_read`
--

DROP TABLE IF EXISTS `chat_read`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_read` (
  `room_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `last_read_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`,`user_id`),
  KEY `fk_chat_read_user` (`user_id`),
  CONSTRAINT `fk_chat_read_room` FOREIGN KEY (`room_id`) REFERENCES `chat_room` (`id`),
  CONSTRAINT `fk_chat_read_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_read`
--

LOCK TABLES `chat_read` WRITE;
/*!40000 ALTER TABLE `chat_read` DISABLE KEYS */;
INSERT INTO `chat_read` VALUES (1,1,'2025-11-27 16:39:43'),(1,2,'2025-11-27 17:55:13'),(1,3,'2025-11-26 17:54:24'),(2,1,'2025-11-27 15:12:38'),(2,2,'2025-11-26 17:10:07'),(2,3,'2025-11-25 18:05:31'),(3,1,'2025-11-25 18:15:55'),(3,2,'2025-11-27 16:40:21'),(4,1,'2025-11-25 18:15:56'),(5,1,'2025-11-25 18:15:51'),(5,2,'2025-11-26 17:10:09'),(5,3,'2025-11-25 18:07:47'),(6,2,'2025-11-27 17:55:06'),(6,3,'2025-11-26 17:54:18');
/*!40000 ALTER TABLE `chat_read` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_room`
--

DROP TABLE IF EXISTS `chat_room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_room` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('GAME','DM') NOT NULL,
  `game_id` bigint unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_chat_room_game` (`game_id`),
  CONSTRAINT `fk_chat_room_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_room`
--

LOCK TABLES `chat_room` WRITE;
/*!40000 ALTER TABLE `chat_room` DISABLE KEYS */;
INSERT INTO `chat_room` VALUES (1,'GAME',1,'2025-11-25 16:32:06','2025-11-25 16:32:06'),(2,'GAME',3,'2025-11-25 16:32:48','2025-11-25 16:32:48'),(3,'DM',NULL,'2025-11-25 16:33:04','2025-11-25 16:33:04'),(4,'DM',NULL,'2025-11-25 17:09:57','2025-11-25 17:09:57'),(5,'GAME',2,'2025-11-25 17:15:34','2025-11-25 17:15:34'),(6,'DM',NULL,'2025-11-25 17:54:29','2025-11-25 17:54:29');
/*!40000 ALTER TABLE `chat_room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_room_user`
--

DROP TABLE IF EXISTS `chat_room_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_room_user` (
  `room_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`room_id`,`user_id`),
  KEY `fk_chat_room_user_user` (`user_id`),
  CONSTRAINT `fk_chat_room_user_room` FOREIGN KEY (`room_id`) REFERENCES `chat_room` (`id`),
  CONSTRAINT `fk_chat_room_user_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_room_user`
--

LOCK TABLES `chat_room_user` WRITE;
/*!40000 ALTER TABLE `chat_room_user` DISABLE KEYS */;
INSERT INTO `chat_room_user` VALUES (1,1,'2025-11-25 18:13:37'),(1,2,'2025-11-25 18:01:51'),(1,3,'2025-11-25 18:02:43'),(2,1,'2025-11-25 18:13:35'),(2,2,'2025-11-25 18:01:58'),(2,3,'2025-11-25 18:05:15'),(3,1,'2025-11-25 16:33:04'),(3,2,'2025-11-25 16:33:04'),(4,1,'2025-11-25 17:09:57'),(4,3,'2025-11-25 17:09:57'),(5,1,'2025-11-25 18:13:03'),(5,2,'2025-11-25 18:02:04'),(5,3,'2025-11-25 18:05:35'),(6,2,'2025-11-25 17:54:29'),(6,3,'2025-11-25 17:54:29');
/*!40000 ALTER TABLE `chat_room_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follows`
--

DROP TABLE IF EXISTS `follows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follows` (
  `follower_id` bigint unsigned NOT NULL,
  `following_id` bigint unsigned NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`,`following_id`),
  KEY `fk_follows_following` (`following_id`),
  CONSTRAINT `fk_follows_follower` FOREIGN KEY (`follower_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_follows_following` FOREIGN KEY (`following_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follows`
--

LOCK TABLES `follows` WRITE;
/*!40000 ALTER TABLE `follows` DISABLE KEYS */;
INSERT INTO `follows` VALUES (1,2,'2025-11-27 14:55:30'),(2,3,'2025-11-27 17:28:59'),(3,2,'2025-11-26 12:54:27');
/*!40000 ALTER TABLE `follows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `games`
--

DROP TABLE IF EXISTS `games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `games` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `games`
--

LOCK TABLES `games` WRITE;
/*!40000 ALTER TABLE `games` DISABLE KEYS */;
INSERT INTO `games` VALUES (1,'League of Legends','league-of-legends','2025-11-25 02:34:51'),(2,'Valorant','valorant','2025-11-25 02:54:03'),(3,'Overwatch 2','overwatch-2','2025-11-25 02:54:03');
/*!40000 ALTER TABLE `games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` varchar(50) NOT NULL,
  `actor_id` int DEFAULT NULL,
  `post_id` int DEFAULT NULL,
  `room_id` int DEFAULT NULL,
  `message` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'CHAT_MESSAGE',3,NULL,1,'zz',1,'2025-11-26 12:38:07'),(2,2,'CHAT_MESSAGE',3,NULL,1,'zz',1,'2025-11-26 12:38:07'),(3,1,'CHAT_MESSAGE',3,NULL,1,'dd',1,'2025-11-26 12:38:14'),(4,2,'CHAT_MESSAGE',3,NULL,1,'dd',1,'2025-11-26 12:38:14'),(5,2,'CHAT_MESSAGE',3,NULL,6,'ㅈㅈㅈㅈ',1,'2025-11-26 12:38:25'),(6,3,'FOLLOWED_USER_POST',2,12,NULL,'www',1,'2025-11-26 12:53:12'),(7,3,'CHAT_MESSAGE',2,NULL,6,'1111',1,'2025-11-26 13:15:21'),(8,2,'CHAT_MESSAGE',3,NULL,6,'ㅇㅇㅇㅇ',1,'2025-11-26 16:58:57'),(9,2,'CHAT_MESSAGE',3,NULL,6,'2222',1,'2025-11-26 16:59:03'),(10,2,'CHAT_MESSAGE',3,NULL,6,'4444',1,'2025-11-26 16:59:23'),(11,3,'CHAT_MESSAGE',2,NULL,6,'11',0,'2025-11-26 17:03:06'),(12,2,'CHAT_MESSAGE',3,NULL,6,'22',1,'2025-11-26 17:03:09'),(13,2,'CHAT_MESSAGE',3,NULL,6,'ㅁㅁ',1,'2025-11-26 17:03:59'),(14,2,'CHAT_MESSAGE',3,NULL,6,'ㅇㅇㅇ',1,'2025-11-26 17:14:07'),(15,2,'CHAT_MESSAGE',3,NULL,6,'ㅁㄴㅇ',1,'2025-11-26 17:14:08'),(16,2,'CHAT_MESSAGE',3,NULL,6,'ㅂㅈㄷ',1,'2025-11-26 17:14:09'),(17,2,'CHAT_MESSAGE',3,NULL,6,'ㅁㄴㅇ',1,'2025-11-26 17:14:26'),(18,2,'CHAT_MESSAGE',3,NULL,6,'ㅈㅂㄱ',1,'2025-11-26 17:14:31'),(19,2,'CHAT_MESSAGE',3,NULL,6,'ㅁㄴㅇ',1,'2025-11-26 17:54:18'),(20,1,'CHAT_MESSAGE',3,NULL,1,'222',1,'2025-11-26 17:54:24'),(21,2,'CHAT_MESSAGE',3,NULL,1,'222',1,'2025-11-26 17:54:24'),(22,2,'CHAT_MESSAGE',1,NULL,1,'ㅁㅁㅁ',1,'2025-11-27 16:39:43'),(23,3,'CHAT_MESSAGE',1,NULL,1,'ㅁㅁㅁ',0,'2025-11-27 16:39:43'),(24,1,'CHAT_MESSAGE',2,NULL,3,'111',0,'2025-11-27 16:40:21'),(25,1,'CHAT_MESSAGE',2,NULL,1,'222',0,'2025-11-27 17:41:16'),(26,3,'CHAT_MESSAGE',2,NULL,1,'222',0,'2025-11-27 17:41:16');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_bookmarks`
--

DROP TABLE IF EXISTS `post_bookmarks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_bookmarks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_bookmark` (`post_id`,`user_id`),
  KEY `idx_post_bookmarks_user` (`user_id`,`post_id`),
  KEY `idx_post_bookmarks_post` (`post_id`),
  CONSTRAINT `fk_post_bookmarks_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_bookmarks_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_bookmarks`
--

LOCK TABLES `post_bookmarks` WRITE;
/*!40000 ALTER TABLE `post_bookmarks` DISABLE KEYS */;
INSERT INTO `post_bookmarks` VALUES (5,10,3,'2025-11-25 08:20:52'),(12,9,1,'2025-11-26 09:12:48'),(14,11,2,'2025-11-27 02:45:03'),(15,14,2,'2025-11-27 07:27:48');
/*!40000 ALTER TABLE `post_bookmarks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_comments`
--

DROP TABLE IF EXISTS `post_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_comments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_post_comments_user` (`user_id`),
  KEY `idx_post_comments_post` (`post_id`,`created_at`),
  CONSTRAINT `fk_post_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_post_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
INSERT INTO `post_comments` VALUES (1,8,2,'댓글테스트1234','2025-11-25 04:01:45'),(2,8,2,'바로댓글1','2025-11-25 06:12:39'),(3,8,2,'qwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsn','2025-11-25 06:24:50'),(4,8,2,'qwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsn','2025-11-25 06:24:59'),(5,11,2,'sss','2025-11-26 07:41:51'),(6,11,2,'굿','2025-11-27 02:41:22'),(7,11,2,'ㅁㅁ','2025-11-27 02:49:07'),(8,11,2,'ㅌㅌ','2025-11-27 02:49:16'),(9,9,1,'zz','2025-11-27 05:57:36'),(10,11,1,'aa','2025-11-27 06:01:38'),(11,9,1,'22','2025-11-27 06:01:59'),(12,11,1,'22','2025-11-27 06:02:49'),(13,14,2,'aa','2025-11-27 07:27:56'),(14,14,2,'22','2025-11-27 07:27:59');
/*!40000 ALTER TABLE `post_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_likes`
--

DROP TABLE IF EXISTS `post_likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_likes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`,`user_id`),
  KEY `idx_likes_user` (`user_id`),
  CONSTRAINT `fk_likes_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (3,6,2,'2025-11-25 03:21:32'),(11,8,2,'2025-11-26 01:33:45'),(28,11,2,'2025-11-27 02:45:07'),(30,14,2,'2025-11-27 07:27:48');
/*!40000 ALTER TABLE `post_likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_media`
--

DROP TABLE IF EXISTS `post_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `media_type` enum('IMAGE','VIDEO') NOT NULL,
  `url` varchar(500) NOT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_post` (`post_id`,`sort_order`),
  CONSTRAINT `fk_media_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_media`
--

LOCK TABLES `post_media` WRITE;
/*!40000 ALTER TABLE `post_media` DISABLE KEYS */;
INSERT INTO `post_media` VALUES (4,6,'IMAGE','/uploads/i016824155089-1764039609244-406313800.gif',0,'2025-11-25 03:00:09'),(5,7,'IMAGE','/uploads/banana-1764039970773-643246038.jpg',0,'2025-11-25 03:06:10'),(6,7,'IMAGE','/uploads/bank-1764039970775-829040820.jpg',1,'2025-11-25 03:06:10'),(7,7,'IMAGE','/uploads/bori-1764039970780-502451174.jpg',2,'2025-11-25 03:06:10'),(8,8,'VIDEO','/uploads/flower-1764039986064-172412332.mp4',0,'2025-11-25 03:06:26'),(9,9,'IMAGE','/uploads/cabbage-1764050676144-459539347.jpg',0,'2025-11-25 06:04:36'),(10,11,'IMAGE','/uploads/GClipLogo-1764122809487-589325386.png',0,'2025-11-26 02:06:49'),(14,14,'IMAGE','/uploads/logo-1764228455817-459883405.png',0,'2025-11-27 07:27:35');
/*!40000 ALTER TABLE `post_media` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `post_tags`
--

DROP TABLE IF EXISTS `post_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_tags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL,
  `tag_id` bigint NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_tag` (`post_id`,`tag_id`),
  KEY `tag_id` (`tag_id`),
  CONSTRAINT `post_tags_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`),
  CONSTRAINT `post_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_tags`
--

LOCK TABLES `post_tags` WRITE;
/*!40000 ALTER TABLE `post_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `post_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `posts`
--

DROP TABLE IF EXISTS `posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `game_id` bigint unsigned DEFAULT NULL,
  `caption` text,
  `like_count` int unsigned NOT NULL DEFAULT '0',
  `comment_count` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_posts_created` (`created_at` DESC),
  KEY `idx_posts_user` (`user_id`),
  KEY `fk_posts_game` (`game_id`),
  CONSTRAINT `fk_posts_game` FOREIGN KEY (`game_id`) REFERENCES `games` (`id`),
  CONSTRAINT `fk_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (6,2,1,'롤 하이라이트',1,0,'2025-11-25 03:00:09'),(7,2,3,'오버워치 하이라이트',0,0,'2025-11-25 03:06:10'),(8,2,2,'발로란트 하이라이트',1,4,'2025-11-25 03:06:26'),(9,2,1,'sdaopoqowjoppojropqwrojqpwrjowrjowpqjropwqjrowqrqworwqrwqrqwrqwrqwrqwrqwrr',0,2,'2025-11-25 06:04:36'),(10,2,3,'가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카',0,0,'2025-11-25 06:08:25'),(11,2,1,'aaa',1,6,'2025-11-26 02:06:49'),(14,1,1,'aaweqw',1,2,'2025-11-27 07:27:35');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` int NOT NULL,
  `target_user_id` int DEFAULT NULL,
  `target_post_id` int DEFAULT NULL,
  `reason` varchar(500) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_achievements`
--

DROP TABLE IF EXISTS `user_achievements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_achievements` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `achievement_id` bigint NOT NULL,
  `achieved_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_ach` (`user_id`,`achievement_id`),
  KEY `achievement_id` (`achievement_id`),
  CONSTRAINT `user_achievements_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `user_achievements_ibfk_2` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_achievements`
--

LOCK TABLES `user_achievements` WRITE;
/*!40000 ALTER TABLE `user_achievements` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_achievements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_blocks`
--

DROP TABLE IF EXISTS `user_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_blocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `blocker_id` int NOT NULL,
  `blocked_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_block` (`blocker_id`,`blocked_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_blocks`
--

LOCK TABLES `user_blocks` WRITE;
/*!40000 ALTER TABLE `user_blocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_favorite_games`
--

DROP TABLE IF EXISTS `user_favorite_games`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_favorite_games` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `game_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_game` (`user_id`,`game_name`),
  CONSTRAINT `fk_fav_game_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_favorite_games`
--

LOCK TABLES `user_favorite_games` WRITE;
/*!40000 ALTER TABLE `user_favorite_games` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_favorite_games` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_stats`
--

DROP TABLE IF EXISTS `user_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_stats` (
  `user_id` bigint unsigned NOT NULL,
  `post_count` int DEFAULT '0',
  `received_likes` int DEFAULT '0',
  `received_comments` int DEFAULT '0',
  `exp` int DEFAULT '0',
  `level` int DEFAULT '1',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_stats`
--

LOCK TABLES `user_stats` WRITE;
/*!40000 ALTER TABLE `user_stats` DISABLE KEYS */;
INSERT INTO `user_stats` VALUES (1,2,1,4,54,1,'2025-11-27 16:27:35'),(2,0,6,5,27,1,'2025-11-27 16:27:59');
/*!40000 ALTER TABLE `user_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `nickname` varchar(50) NOT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `bio` varchar(200) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'test@example.com','$2b$10$EFnGLEGX4uclTx1VRRDh4.ukAsU/goBXXeFMxcvgJGGIYrZX9.rSq','testuser','테스트유저','/uploads/avatar/avatar-1-1764138294308.png','','2025-11-24 08:30:12'),(2,'sungmin3790@gmail.com','$2b$10$/jgLndM0tTfrLW6yKHUeduuwgLOUscx1F.3w7T0S9EljXYXeyTNr2','seongmin3790','김성민','/uploads/avatar/avatar-2-1764118151005.png','adv','2025-11-24 08:51:11'),(3,'tjdals3790@naver.com','$2b$10$i11D7ZOjoOrTgpKQTya4T.PFXIZvo3BhJuYJGJYN4EhouS/LvzHFO','tjdals3790','성민김','/uploads/avatar/avatar-3-1764129173901.webp','','2025-11-25 07:59:11');
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

-- Dump completed on 2025-11-27 18:11:33
