import os

class Config:
    SECRET_KEY = '345678'
    SQLALCHEMY_DATABASE_URI = 'mysql+mysqlconnector://user1:1234@localhost/doacao_sangue'
    SQLALCHEMY_TRACK_MODIFICATIONS = False