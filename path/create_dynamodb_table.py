#!/usr/bin/env python3
"""
P.A.T.H Agent Designer용 DynamoDB 테이블 생성 스크립트
"""
import boto3

def create_table():
    dynamodb = boto3.client('dynamodb', region_name='ap-northeast-2')
    
    try:
        response = dynamodb.create_table(
            TableName='path-agent-sessions',
            KeySchema=[
                {
                    'AttributeName': 'session_id',
                    'KeyType': 'HASH'  # Partition key
                }
            ],
            AttributeDefinitions=[
                {
                    'AttributeName': 'session_id',
                    'AttributeType': 'S'
                },
                {
                    'AttributeName': 'timestamp',
                    'AttributeType': 'S'
                }
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'timestamp-index',
                    'KeySchema': [
                        {
                            'AttributeName': 'timestamp',
                            'KeyType': 'HASH'
                        }
                    ],
                    'Projection': {
                        'ProjectionType': 'ALL'
                    }
                }
            ],
            BillingMode='PAY_PER_REQUEST',
            Tags=[
                {
                    'Key': 'Application',
                    'Value': 'PATH-Agent-Designer'
                }
            ]
        )
        
        print("✅ 테이블 생성 시작...")
        print(f"테이블 ARN: {response['TableDescription']['TableArn']}")
        print("\n테이블이 ACTIVE 상태가 될 때까지 기다려주세요 (약 1분 소요)")
        print("\n확인: aws dynamodb describe-table --table-name path-agent-sessions --region us-east-1")
        
    except dynamodb.exceptions.ResourceInUseException:
        print("⚠️  테이블이 이미 존재합니다.")
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")

if __name__ == "__main__":
    create_table()
