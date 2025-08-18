from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser

def generate_summary(text):
    prompt = PromptTemplate.from_template("""
        Summarize the medical PDF content below:

        {text}

        Summary (in JSON):
    """)

    llm = ChatGroq(temperature=0.7, model_name="mixtral-8x7b-32768")
    chain = prompt | llm | JsonOutputParser()

    response = chain.invoke({"text": text})
    return response
