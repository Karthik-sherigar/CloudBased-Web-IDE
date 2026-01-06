def count_character(file_name):
    vowels="AEIOUaeiou"
    vowel_count=0
    consonant_count=0
    uppercase_count=0
    lowercase_count=0
    with open(file_name,"r")as file:
        text=file.read()
    for char in text:
        if char.isalpha():
            if char in vowels:
                vowel_count+=1
            else:
                consonant_count+=1
            if char.isupper():
                uppercase_count+=1
            elif char.islower():
                lowercase_count+=1
    print("vowels:",vowel_count)
    print("consonant:",consonant_count)
    print("uppercase:",uppercase_count)
    print("lowercase:",lowercase_count)
def create_text_file(file_name,content):
    with open(file_name,"w")as file:
        file.write(content)
file_name="sample.txt"
content=input("enter the few sentence to create a text file")
create_text_file(file_name,content)
count_character(file_name)
