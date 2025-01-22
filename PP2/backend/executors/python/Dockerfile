# Use a lightweight base image for Python
FROM python:3.9-slim

# Install optional linters or libraries if needed
RUN pip install --no-cache-dir pylint

# Set working directory inside the container
WORKDIR /usr/src/app

# CMD specifies the default command to run in the container
CMD ["python3"]
# FROM python:latest
# WORKDIR /usr/app/src
# COPY temp.py /usr/app/src/
# ENTRYPOINT ["python", "-i", "temp.py"]