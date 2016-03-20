from selenium import webdriver
import simdraw

simdraw.render()
driver = webdriver.Chrome()
driver.get("file:///C:/Users/ahduv/PycharmProjects/simdraw/example/out.html")