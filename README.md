erDiagram
    USER ||--o{ REPORT : "creates"
    USER }o--o| COMMUNITY : "belongs to"
    COMMUNITY ||--o{ USER : "has admins"
    COMMUNITY ||--o{ REPORT : "contains"
    REPORT ||--o{ MATCH : "part of (lost)"
    REPORT ||--o{ MATCH : "part of (found)"
    USER ||--o{ CONVERSATION : "participates"
    REPORT ||--o{ CONVERSATION : "related to"
    CONVERSATION ||--o{ MESSAGE : "contains"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ NOTIFICATION : "receives"
    USER ||--o{ TRANSACTION : "makes"

    USER {
        ObjectId _id PK
        String name
        String email
        String password "hashed"
        String role "user/admin/super_admin"
        ObjectId community FK
        String plan "Free/Premium"
        Number credits
        Number trustScore
        Number activityScore
        Boolean isVerified
        String socialProvider
    }

    COMMUNITY {
        ObjectId _id PK
        String name
        String domain
        String type
        String status
        ObjectId[] admins FK
    }

    REPORT {
        ObjectId _id PK
        String title
        String description
        String type "LOST/FOUND"
        String category
        String subCategory
        String color
        String brand
        String[] tags
        String locationName
        String[] images
        Date dateHappened
        String status
        Number completionPercent
        ObjectId user FK
        ObjectId community FK
    }

    MATCH {
        ObjectId _id PK
        ObjectId lostReport_report FK
        Boolean lostReport_isAccepted
        ObjectId foundReport_report FK
        Boolean foundReport_isAccepted
        Number distance
        Number score
        String status "PROPOSED/ACCEPTED/REJECTED/VERIFIED"
    }

    CONVERSATION {
        ObjectId _id PK
        ObjectId[] participants FK
        ObjectId relatedReport FK
        String lastMessage
        Date lastMessageAt
        Boolean isActive
    }

    MESSAGE {
        ObjectId _id PK
        ObjectId conversationId FK
        ObjectId sender FK
        String content
        String[] attachments
        ObjectId[] readBy FK
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipient FK
        String category
        String title
        String message
        ObjectId data_reportId FK
        ObjectId data_conversationId FK
        Boolean isRead
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId user FK
        Number amount
        String currency
        String type "CREDIT_REFILL/SUBSCRIPTION"
        Number creditsAdded
        String stripePaymentId
        String status
    }
