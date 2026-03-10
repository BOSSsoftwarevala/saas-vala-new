import os
import sqlite3  # Example using SQLite; adjust as needed for your DB
import json

# Database connection
def connect_db(db_file):
    conn = sqlite3.connect(db_file)
    return conn

# Load existing products from the database
def load_existing_products(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT product_id FROM products")  # Adjust based on your schema
    return {row[0] for row in cursor.fetchall()}

# Scan data files and insert missing products
def migrate_products(conn, data_directory):
    existing_products = load_existing_products(conn)
    cursor = conn.cursor()

    for filename in os.listdir(data_directory):
        if filename.endswith(".json"):  # Assuming data files are in JSON format
            with open(os.path.join(data_directory, filename), 'r') as file:
                products = json.load(file)
                for product in products:
                    if product['id'] not in existing_products:
                        cursor.execute("INSERT INTO products (product_id, name, price) VALUES (?, ?, ?)",
                                       (product['id'], product['name'], product['price']))  # Adjust columns as necessary
                        existing_products.add(product['id'])  # Update the set with the newly inserted product
    
    conn.commit()

if __name__ == "__main__":
    db_file = 'path_to_your_database.db'  # Change this to your database path
    data_directory = 'path_to_data_files'  # Change this to your data files directory

    conn = connect_db(db_file)
    try:
        migrate_products(conn, data_directory)
    finally:
        conn.close()