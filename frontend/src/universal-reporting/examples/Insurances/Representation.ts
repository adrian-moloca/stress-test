import { tViewItem } from '@smambu/lib.constants'

export const insuranceRepresentation: tViewItem[] = [

  {
    fieldId: 'dynamicFields',
    label: {
      en: 'Dynamic Fields'
    },
    description: {
      en: 'Dynamic Fields description'
    },
    viewAs: {
      representationKind: 'object',
      subFields: [{
        fieldId: 'insuranceStatus',
        label: {
          en: 'Insurance Status'
        },
        description: {
          en: 'Simple Object Dropdown description'
        },
        viewAs: {
          representationKind: 'enum',
          labelField: {
            expressionKind: 'functionInvocation',
            function: 'map',
            parameters: {
              sourceArray: {
                expressionKind: 'symbolOperator',
                name: 'options'
              },
              callback: {
                expressionKind: 'lambdaOperator',
                args: [
                  'current'
                ],
                body: {
                  expressionKind: 'objectOfExpressions',
                  value: {
                    $value: {
                      expressionKind: 'symbolOperator',
                      name: 'current'
                    },
                    $label: {
                      expressionKind: 'symbolOperator',
                      name: 'current'
                    }
                  }
                }
              }
            },
            typeHint: {
              kind: 'list',
              itemType: {
                type: {
                  kind: 'object',
                  object: {
                    $label: {
                      type: {
                        kind: 'string'
                      },
                      mergePolicies: {
                        horizontal: 'OVERWRITE',
                        vertical: 'PARENT'
                      },
                      readable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      },
                      writable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      }
                    },
                    $value: {
                      type: {
                        kind: 'string'
                      },
                      mergePolicies: {
                        horizontal: 'OVERWRITE',
                        vertical: 'PARENT'
                      },
                      readable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      },
                      writable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      }
                    }
                  }
                },
                mergePolicies: {
                  horizontal: 'OVERWRITE',
                  vertical: 'PARENT'
                },
                readable: {
                  expressionKind: 'literalBoolean',
                  value: true,
                  typeHint: {
                    kind: 'boolean'
                  }
                },
                writable: {
                  expressionKind: 'literalBoolean',
                  value: true,
                  typeHint: {
                    kind: 'boolean'
                  }
                }
              }
            }
          }
        },
        override: {
          expressionKind: 'literalBoolean',
          value: true,
          typeHint: {
            kind: 'boolean'
          }
        },
        required: {
          expressionKind: 'literalBoolean',
          value: true,
          typeHint: {
            kind: 'boolean'
          }
        },
        hide: {
          expressionKind: 'literalBoolean',
          value: false,
          typeHint: {
            kind: 'boolean'
          }
        },
        span: 12,
        margin: 0
      },
      {
        fieldId: 'insurance',
        label: {
          en: 'Simple Object Dropdown'
        },
        description: {
          en: 'Simple Object Dropdown description'
        },
        viewAs: {
          representationKind: 'enum',
          labelField: {
            expressionKind: 'functionInvocation',
            function: 'map',
            parameters: {
              sourceArray: {
                expressionKind: 'symbolOperator',
                name: 'options'
              },
              callback: {
                expressionKind: 'lambdaOperator',
                args: [
                  'current'
                ],
                body: {
                  expressionKind: 'objectOfExpressions',
                  value: {
                    $value: {
                      expressionKind: 'symbolOperator',
                      name: 'current'
                    },
                    $label: {
                      expressionKind: 'symbolOperator',
                      name: 'current'
                    }
                  }
                }
              }
            },
            typeHint: {
              kind: 'list',
              itemType: {
                type: {
                  kind: 'object',
                  object: {
                    $label: {
                      type: {
                        kind: 'string'
                      },
                      mergePolicies: {
                        horizontal: 'OVERWRITE',
                        vertical: 'PARENT'
                      },
                      readable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      },
                      writable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      }
                    },
                    $value: {
                      type: {
                        kind: 'string'
                      },
                      mergePolicies: {
                        horizontal: 'OVERWRITE',
                        vertical: 'PARENT'
                      },
                      readable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      },
                      writable: {
                        expressionKind: 'literalBoolean',
                        value: true,
                        typeHint: {
                          kind: 'boolean'
                        }
                      }
                    }
                  }
                },
                mergePolicies: {
                  horizontal: 'OVERWRITE',
                  vertical: 'PARENT'
                },
                readable: {
                  expressionKind: 'literalBoolean',
                  value: true,
                  typeHint: {
                    kind: 'boolean'
                  }
                },
                writable: {
                  expressionKind: 'literalBoolean',
                  value: true,
                  typeHint: {
                    kind: 'boolean'
                  }
                }
              }
            }
          }
        },
        override: {
          expressionKind: 'literalBoolean',
          value: true,
          typeHint: {
            kind: 'boolean'
          }
        },
        required: {
          expressionKind: 'literalBoolean',
          value: true,
          typeHint: {
            kind: 'boolean'
          }
        },
        hide: {
          expressionKind: 'equalsOperator',
          left: {
            expressionKind: 'selfOperator',
            paths: [
              'dynamicFields', 'insuranceStatus'
            ]
          },
          right: {
            expressionKind: 'literalString',
            value: 'NONE'
          },
          typeHint: {
            kind: 'boolean'
          }
        },
        span: 12,
        margin: 0
      }]
    },
    override: {
      expressionKind: 'literalBoolean',
      value: true,
      typeHint: {
        kind: 'boolean'
      }
    },
    required: {
      expressionKind: 'literalBoolean',
      value: true,
      typeHint: {
        kind: 'boolean'
      }
    },
    hide: {
      expressionKind: 'literalBoolean',
      value: false,
      typeHint: {
        kind: 'boolean'
      }
    },
    span: 12,
    margin: 0
  },
]
