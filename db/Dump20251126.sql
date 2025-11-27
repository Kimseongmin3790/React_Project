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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_message`
--

LOCK TABLES `chat_message` WRITE;
/*!40000 ALTER TABLE `chat_message` DISABLE KEYS */;
INSERT INTO `chat_message` VALUES (1,1,2,'롤 채팅방 111','2025-11-25 16:32:13'),(2,1,1,'롤 채팅방 222','2025-11-25 16:32:38'),(3,3,1,'ㅁㄴㅇㅁㄴㅇ','2025-11-25 16:33:43'),(4,3,2,'aaa','2025-11-25 16:33:59'),(5,2,2,'오버워치 채팅방 111','2025-11-25 18:02:02'),(6,5,2,'발로란트 채팅방 111','2025-11-25 18:02:08'),(7,1,2,'롤 채팅방 333333','2025-11-25 18:02:14'),(8,6,2,'알림11111','2025-11-25 18:02:27'),(9,6,2,'22222','2025-11-25 18:02:29'),(10,6,2,'33333333','2025-11-25 18:02:31'),(11,1,3,'aaa','2025-11-25 18:02:46'),(12,1,3,'zz','2025-11-25 18:04:48'),(13,1,3,'111','2025-11-25 18:04:56'),(14,2,3,'123','2025-11-25 18:05:17'),(15,2,3,'222','2025-11-25 18:05:25'),(16,2,3,'33434','2025-11-25 18:05:31'),(17,5,3,'2525','2025-11-25 18:05:37'),(18,5,3,'2424','2025-11-25 18:05:43'),(19,1,3,'2233','2025-11-25 18:05:52'),(20,6,3,'444','2025-11-25 18:06:16'),(21,6,2,'555','2025-11-25 18:06:27'),(22,6,2,'safsf','2025-11-25 18:06:32'),(23,5,2,'215251','2025-11-25 18:06:38'),(24,5,2,'5555','2025-11-25 18:07:08'),(25,6,2,'55555','2025-11-25 18:07:31'),(26,1,2,'dddd','2025-11-25 18:07:46'),(27,6,2,'ㅇㅇㅇㅇ','2025-11-25 18:08:53'),(28,6,3,'ㅇㅇㅇㅇ','2025-11-25 18:08:57'),(29,1,2,'ㄱㄱㄱㄱ','2025-11-25 18:09:06'),(30,1,2,'ㅇㅇㅇ','2025-11-25 18:12:51'),(31,2,2,'ㅁㅁㅁ','2025-11-25 18:12:56'),(32,5,2,'ㅇㅇㅇㅇ','2025-11-25 18:12:59'),(33,5,2,'ㅇㅇㅇ','2025-11-25 18:13:09'),(34,3,2,'222','2025-11-25 18:13:20'),(35,3,2,'2424','2025-11-25 18:13:24'),(36,5,2,'ㅁㅁㅁ','2025-11-25 18:13:28'),(37,4,1,'ㅁㅁㅁ','2025-11-25 18:15:35'),(38,6,2,'ㅋㅋㅋㅋ','2025-11-25 18:19:27');
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
INSERT INTO `chat_read` VALUES (1,1,'2025-11-25 18:15:47'),(1,2,'2025-11-25 18:12:51'),(1,3,'2025-11-25 18:09:20'),(2,1,'2025-11-25 18:15:49'),(2,2,'2025-11-25 18:12:56'),(2,3,'2025-11-25 18:05:31'),(3,1,'2025-11-25 18:15:55'),(3,2,'2025-11-25 18:13:24'),(4,1,'2025-11-25 18:15:56'),(5,1,'2025-11-25 18:15:51'),(5,2,'2025-11-25 18:13:28'),(5,3,'2025-11-25 18:07:47'),(6,2,'2025-11-25 18:19:27'),(6,3,'2025-11-25 18:08:57');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_bookmarks`
--

LOCK TABLES `post_bookmarks` WRITE;
/*!40000 ALTER TABLE `post_bookmarks` DISABLE KEYS */;
INSERT INTO `post_bookmarks` VALUES (3,8,2,'2025-11-25 05:18:57'),(5,10,3,'2025-11-25 08:20:52');
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_comments`
--

LOCK TABLES `post_comments` WRITE;
/*!40000 ALTER TABLE `post_comments` DISABLE KEYS */;
INSERT INTO `post_comments` VALUES (1,8,2,'댓글테스트1234','2025-11-25 04:01:45'),(2,8,2,'바로댓글1','2025-11-25 06:12:39'),(3,8,2,'qwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsn','2025-11-25 06:24:50'),(4,8,2,'qwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsnqwrporwqnopwrqonrnorwonpwronpwqnponpoyonnesnutrsnnrttrntrnssrssrsnrsn','2025-11-25 06:24:59');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_likes`
--

LOCK TABLES `post_likes` WRITE;
/*!40000 ALTER TABLE `post_likes` DISABLE KEYS */;
INSERT INTO `post_likes` VALUES (3,6,2,'2025-11-25 03:21:32'),(9,8,2,'2025-11-25 06:02:31');
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `post_media`
--

LOCK TABLES `post_media` WRITE;
/*!40000 ALTER TABLE `post_media` DISABLE KEYS */;
INSERT INTO `post_media` VALUES (4,6,'IMAGE','/uploads/i016824155089-1764039609244-406313800.gif',0,'2025-11-25 03:00:09'),(5,7,'IMAGE','/uploads/banana-1764039970773-643246038.jpg',0,'2025-11-25 03:06:10'),(6,7,'IMAGE','/uploads/bank-1764039970775-829040820.jpg',1,'2025-11-25 03:06:10'),(7,7,'IMAGE','/uploads/bori-1764039970780-502451174.jpg',2,'2025-11-25 03:06:10'),(8,8,'VIDEO','/uploads/flower-1764039986064-172412332.mp4',0,'2025-11-25 03:06:26'),(9,9,'IMAGE','/uploads/cabbage-1764050676144-459539347.jpg',0,'2025-11-25 06:04:36');
/*!40000 ALTER TABLE `post_media` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `posts`
--

LOCK TABLES `posts` WRITE;
/*!40000 ALTER TABLE `posts` DISABLE KEYS */;
INSERT INTO `posts` VALUES (6,2,1,'롤 하이라이트',1,0,'2025-11-25 03:00:09'),(7,2,3,'오버워치 하이라이트',0,0,'2025-11-25 03:06:10'),(8,2,2,'발로란트 하이라이트',1,4,'2025-11-25 03:06:26'),(9,2,1,'sdaopoqowjoppojropqwrojqpwrjowrjowpqjropwqjrowqrqworwqrwqrqwrqwrqwrqwrqwrr',0,0,'2025-11-25 06:04:36'),(10,2,3,'가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카가나다라마바사아자차카',0,0,'2025-11-25 06:08:25');
/*!40000 ALTER TABLE `posts` ENABLE KEYS */;
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
INSERT INTO `users` VALUES (1,'test@example.com','$2b$10$isL8BzheJlmTUkW5b32Sr.aMua/vN5RVDV7POkiXrkZnwrVKNzVuy','testuser','테스트유저',NULL,NULL,'2025-11-24 08:30:12'),(2,'sungmin3790@gmail.com','$2b$10$/jgLndM0tTfrLW6yKHUeduuwgLOUscx1F.3w7T0S9EljXYXeyTNr2','seongmin3790','김성민',NULL,NULL,'2025-11-24 08:51:11'),(3,'tjdals3790@naver.com','$2b$10$i11D7ZOjoOrTgpKQTya4T.PFXIZvo3BhJuYJGJYN4EhouS/LvzHFO','tjdals3790','성민김',NULL,NULL,'2025-11-25 07:59:11');
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

-- Dump completed on 2025-11-26  9:24:48
