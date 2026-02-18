export type LmsCertificates = {
  "version": "0.1.0",
  "name": "lms_certificates",
  "instructions": [
    {
      "name": "initializeCourse",
      "accounts": [
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "courseId",
          "type": "u64"
        },
        {
          "name": "courseName",
          "type": "string"
        },
        {
          "name": "instructor",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "mintCertificate",
      "accounts": [
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "certificate",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "student",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "courseId",
          "type": "u64"
        },
        {
          "name": "studentName",
          "type": "string"
        },
        {
          "name": "completionDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "verifyCertificate",
      "accounts": [
        {
          "name": "certificate",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "student",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "courseId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "course",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "courseId",
            "type": "u64"
          },
          {
            "name": "courseName",
            "type": "string"
          },
          {
            "name": "instructor",
            "type": "publicKey"
          },
          {
            "name": "totalStudents",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "certificate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "student",
            "type": "publicKey"
          },
          {
            "name": "courseId",
            "type": "u64"
          },
          {
            "name": "studentName",
            "type": "string"
          },
          {
            "name": "completionDate",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CertificateInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "student",
            "type": "publicKey"
          },
          {
            "name": "courseId",
            "type": "u64"
          },
          {
            "name": "studentName",
            "type": "string"
          },
          {
            "name": "completionDate",
            "type": "i64"
          },
          {
            "name": "isValid",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidCourse",
      "msg": "Invalid course ID"
    }
  ]
};

export const IDL: LmsCertificates = {
  "version": "0.1.0",
  "name": "lms_certificates",
  "instructions": [
    {
      "name": "initializeCourse",
      "accounts": [
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "courseId",
          "type": "u64"
        },
        {
          "name": "courseName",
          "type": "string"
        },
        {
          "name": "instructor",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "mintCertificate",
      "accounts": [
        {
          "name": "course",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "certificate",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "student",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "courseId",
          "type": "u64"
        },
        {
          "name": "studentName",
          "type": "string"
        },
        {
          "name": "completionDate",
          "type": "i64"
        }
      ]
    },
    {
      "name": "verifyCertificate",
      "accounts": [
        {
          "name": "certificate",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "student",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "courseId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "course",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "courseId",
            "type": "u64"
          },
          {
            "name": "courseName",
            "type": "string"
          },
          {
            "name": "instructor",
            "type": "publicKey"
          },
          {
            "name": "totalStudents",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "certificate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "student",
            "type": "publicKey"
          },
          {
            "name": "courseId",
            "type": "u64"
          },
          {
            "name": "studentName",
            "type": "string"
          },
          {
            "name": "completionDate",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CertificateInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "publicKey"
          },
          {
            "name": "student",
            "type": "publicKey"
          },
          {
            "name": "courseId",
            "type": "u64"
          },
          {
            "name": "studentName",
            "type": "string"
          },
          {
            "name": "completionDate",
            "type": "i64"
          },
          {
            "name": "isValid",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidCourse",
      "msg": "Invalid course ID"
    }
  ]
};