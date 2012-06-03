-- phpMyAdmin SQL Dump
-- version 3.4.7.1
-- http://www.phpmyadmin.net
--
-- Servidor: localhost
-- Tiempo de generación: 03-06-2012 a las 16:36:51
-- Versión del servidor: 5.0.92
-- Versión de PHP: 5.2.9

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Base de datos: `dakoo_twcl`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciudades`
--

CREATE TABLE IF NOT EXISTS `ciudades` (
  `id` int(11) NOT NULL auto_increment,
  `slug` varchar(150) character set latin1 NOT NULL default '',
  `name` text character set latin1 NOT NULL,
  `lat` varchar(100) character set latin1 NOT NULL default '',
  `lon` varchar(100) character set latin1 NOT NULL default '',
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci AUTO_INCREMENT=324 ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conectores`
--

CREATE TABLE IF NOT EXISTS `conectores` (
  `id` int(11) NOT NULL auto_increment,
  `from_user_id` int(20) NOT NULL default '0',
  `followers` text NOT NULL,
  `friends` text NOT NULL,
  `total_followers` int(11) NOT NULL default '0',
  `total_friends` int(11) NOT NULL default '0',
  PRIMARY KEY  (`id`),
  UNIQUE KEY `id` (`id`,`from_user_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4676 ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pendientes`
--

CREATE TABLE IF NOT EXISTS `pendientes` (
  `id` int(11) NOT NULL auto_increment,
  `from_user_id` int(20) NOT NULL default '0',
  `ciudad` varchar(200) NOT NULL default '',
  `pais` varchar(100) NOT NULL default '',
  `profile_image_url` varchar(250) NOT NULL default '',
  `from_user` varchar(100) NOT NULL default '',
  `location` varchar(250) NOT NULL default '',
  `fecha_ingreso` datetime NOT NULL,
  PRIMARY KEY  (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=240 ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL auto_increment,
  `from_user_id` int(20) NOT NULL default '0',
  `ciudad` varchar(100) NOT NULL default '',
  `pais` varchar(100) NOT NULL default '',
  `profile_image_url` varchar(250) NOT NULL default '',
  `from_user` varchar(100) NOT NULL default '',
  `location` varchar(250) NOT NULL default '',
  `fecha_ingreso` datetime NOT NULL,
  `incluence` int(11) NOT NULL,
  PRIMARY KEY  (`id`),
  UNIQUE KEY `from_user` (`from_user`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=98177 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
