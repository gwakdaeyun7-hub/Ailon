---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 볼츠만 분포, 통계역학, 분배함수, 소프트맥스, 에너지 기반 모델, 볼츠만 머신, 자유 에너지, 온도 파라미터
keywords_en: Boltzmann distribution, statistical mechanics, partition function, softmax, energy-based models, Boltzmann machine, free energy, temperature parameter
---
Boltzmann Distribution and Statistical Mechanics - 열평형 상태의 확률 분포가 AI의 핵심 수학적 구조로 직접 이식된 통계역학의 기초 원리

## 볼츠만 분포의 물리적 원리

방 안의 공기 분자들을 떠올려 보자. 수조 개의 분자가 끊임없이 충돌하고 에너지를 주고받지만, 충분한 시간이 지나면 전체 시스템은 안정된 통계적 패턴에 도달한다. 빠르게 움직이는(에너지가 높은) 분자는 소수이고, 느리게 움직이는(에너지가 낮은) 분자가 다수다. Ludwig Boltzmann(1877)은 이 패턴을 하나의 수식으로 포착했다.

P(state) = e^(-E/kT) / Z

P는 시스템이 에너지 E인 상태에 있을 확률이다. k는 볼츠만 상수(1.38 x 10^-23 J/K)로 미시 세계와 거시 온도를 연결하는 단위 변환 상수이고, T는 절대 온도다. 분모의 Z는 분배함수(partition function)로, 가능한 모든 상태에 대해 분자의 가중치를 합산한 정규화 상수(normalization constant)다.

핵심 직관은 간결하다. **에너지가 낮은 상태일수록 차지할 확률이 높다.** 그리고 온도가 이 분포의 "폭"을 결정한다.

- T가 0에 가까워지면: 시스템은 가장 낮은 에너지 상태 하나에만 갇힌다.
- T가 무한대로 가면: 모든 상태가 균일한 확률을 가진다.
- 중간 온도에서: 낮은 에너지 상태를 선호하되, 높은 에너지 상태도 일정 확률로 존재한다.

## 통계역학에서 AI로: 수식의 직접 이식

볼츠만 분포가 AI에 들어온 경로는 비유적 차용이 아니라 **수학적 형태의 직접 이식**이라는 점에서 이례적이다. 핵심 전환 경로는 다음과 같다.

- Metropolis et al.(1953)이 볼츠만 분포 기반의 수용-거부 규칙을 만들었다 --> 30년 후 Kirkpatrick et al.(1983)의 Simulated Annealing으로 이어졌다
- Hinton & Sejnowski(1983)가 볼츠만 분포를 신경망의 뉴런 활성화 규칙으로 직접 도입하여 볼츠만 머신을 만들었다
- 볼츠만 분포의 수학적 형태 e^(z/T) / sum e^(z_j/T)가 소프트맥스 함수로 그대로 옮겨졌다
- 볼츠만 분포에서 도출되는 자유 에너지 F = -kT ln Z가 변분 추론의 ELBO와 수학적으로 동치인 구조를 제공했다

물리학과 AI 사이의 대응 관계를 정리하면 이렇다.

## 소프트맥스: 볼츠만 분포의 현역 후손

AI에서 가장 보편적인 함수 중 하나인 소프트맥스(softmax)는 볼츠만 분포의 수학적 형태를 그대로 가져온 것이다.

P(class_i) = e^(z_i / T) / sum_j e^(z_j / T)

물리학의 볼츠만 분포와 비교하면 세 가지가 바뀌었다. (1) 에너지 E가 로짓(logit) z로 대체되었다. (2) 음의 부호가 양의 부호로 바뀌었다. 방향만 다르고 구조는 동일하다. (3) 볼츠만 상수 k가 생략되었다. 이 세 가지를 제외하면 **동일한 수식**이다.

온도 T의 역할도 물리학과 정확히 같다. LLM의 텍스트 생성에서 temperature 파라미터를 조절하는 것이 대표적 예다. temperature = 0.1이면 가장 높은 로짓의 토큰이 거의 확정적으로 선택되고, temperature = 2.0이면 다양한 토큰이 선택될 수 있다.

## 분배함수: 강력하지만 계산 불가능한 정규화 상수

분배함수 Z는 물리학에서 열역학 양을 모두 도출할 수 있는 "마스터 키"다. AI에서도 마찬가지여서, 소프트맥스의 분모가 바로 이 분배함수의 역할을 한다.

그런데 Z의 정확한 계산에는 근본적 난관이 있다. N개의 이진 변수가 있는 시스템에서 가능한 상태 수는 2^N이다. 변수가 100개면 약 10^30이다. 이 **분배함수의 계산 불가능성**(intractability)은 볼츠만 분포 기반 AI 모델의 가장 큰 장벽이 되었다.

## 볼츠만 머신: 물리학이 신경망이 되다

Hinton과 Sejnowski(1983)는 볼츠만 분포를 신경망의 학습 원리로 직접 도입하여 볼츠만 머신(Boltzmann Machine)을 만들었다. 에너지 함수는 E(s) = -sum_{i<j} w_ij * s_i * s_j - sum_i b_i * s_i이며, 각 뉴런의 활성화 확률은 볼츠만 분포를 따른다. 원자 간 상호작용 에너지가 배치의 확률을 결정하듯, 뉴런 간 가중치가 네트워크 상태의 확률을 결정한다.

그러나 분배함수 Z의 벽에 부딪혔다. Smolensky(1986)의 제한 볼츠만 머신(RBM)은 같은 층의 뉴런 간 연결을 제거하여 계산을 단순화했지만, Z의 정확한 계산은 여전히 불가능했다.

## 대비 발산과 심층 학습 혁명

Hinton(2002)의 대비 발산(Contrastive Divergence, CD) 알고리즘이 결정적 돌파구를 열었다. CD는 MCMC 샘플링을 단 1~수 스텝만 실행하여 그래디언트를 근사한다. Z를 직접 계산하는 대신 Z의 변화 방향만 추정한 것이다.

이 기법 덕분에 Hinton(2006)은 RBM을 층별로 쌓아 올려 심층 신뢰 신경망(DBN)을 사전 학습하는 데 성공했다. 이 그리디 사전 학습은 심층 신경망이 학습 가능하다는 것을 최초로 실증한 사건이었고, 2006년 이후 딥러닝 르네상스의 도화선이 되었다.

## 현대 AI 기법과의 연결

볼츠만 분포의 수학적 구조는 현대 AI의 여러 영역에 살아 있다.

**동일한 수학적 원리의 직접 적용:**

- **소프트맥스 함수**: 현대 AI의 거의 모든 분류기와 언어 모델에 포함된 소프트맥스는 볼츠만 분포의 수학적 형태 그 자체다. GPT, Claude 등의 temperature 파라미터는 볼츠만 분포의 T와 동일한 수학적 효과를 낸다.
- **볼츠만 머신과 RBM**: 볼츠만 분포를 뉴런 활성화 규칙에 직접 적용한 사례다. DBN 사전 학습을 통해 딥러닝 시대를 열었으나, 2010년대 이후 역전파 기반 심층 신경망에 의해 주류에서 밀려났다.
- **에너지 기반 모델(EBM)**: LeCun(2006)이 제안한 프레임워크로, "낮은 에너지 = 높은 확률" 원리를 일반화했다.
- **변분 추론과 ELBO**: 자유 에너지 F = -kT ln Z는 에너지와 엔트로피 사이의 경쟁을 하나의 양으로 압축한다. VAE(Kingma & Welling 2014)의 ELBO는 통계역학의 변분 자유 에너지와 수학적으로 동치다.

**동일한 직관을 독립적으로 공유하는 구조적 유사성:**

## 한계와 약점

- **분배함수 Z의 계산 불가능성**: 볼츠만 분포 기반 모델의 가장 근본적인 장벽이다. CD와 같은 근사 방법은 정확하지 않으며, 이 한계가 볼츠만 머신을 역전파 기반 신경망에 비해 실용적으로 밀리게 만들었다.
- **평형 가정의 한계**: 볼츠만 분포는 시스템이 열평형에 도달했을 때만 성립한다. 실제 신경망의 학습 과정은 비평형 동역학에 가까우며, 이론적 보장과 실제 동작 사이의 간극을 만든다.
- **고차원 샘플링의 느린 혼합**: MCMC 기반 샘플링은 차원이 높아질수록 상태 공간을 효율적으로 탐색하지 못하는 혼합 문제를 겪는다. 볼츠만 분포 기반 모델의 확장성을 제한한다.
- **역사적 쇠퇴와 생존**: 볼츠만 머신/RBM/DBN은 2010년대 이후 주류에서 밀려났다. 그러나 볼츠만 분포의 수학은 소프트맥스, temperature, ELBO라는 형태로 현대 AI 전역에 살아 있다. 원래 모델은 사라졌으나 수학적 뼈대가 생존한 독특한 사례다.

## 용어 정리

볼츠만 분포(Boltzmann distribution) - 열평형 상태에서 시스템이 에너지 E인 상태에 있을 확률을 기술하는 분포. P ~ e^(-E/kT) 형태로, 낮은 에너지일수록 높은 확률

분배함수(partition function) - 볼츠만 분포의 정규화 상수. 가능한 모든 상태의 볼츠만 가중치를 합산한 값 Z = sum e^(-E/kT)

자유 에너지(free energy) - 에너지(안정성)와 엔트로피(무질서)의 경쟁을 하나의 양으로 압축한 열역학 함수. F = -kT ln Z

소프트맥스(softmax) - 실수 벡터를 확률 분포로 변환하는 함수. 볼츠만 분포에서 부호만 바꾸고 k를 생략한 동일한 수학적 형태

로짓(logit) - 소프트맥스에 입력되는 비정규화 점수 벡터. 신경망 마지막 층의 출력으로, 볼츠만 분포의 에너지에 대응

대비 발산(contrastive divergence, CD) - Hinton(2002)이 제안한 학습 알고리즘. 분배함수를 직접 계산하지 않고 MCMC를 수 스텝만 돌려 그래디언트를 근사

제한 볼츠만 머신(Restricted Boltzmann Machine, RBM) - 같은 층 뉴런 간 연결을 제거하여 조건부 독립을 확보한 볼츠만 머신의 변형. Smolensky(1986) 제안

에너지 기반 모델(energy-based model, EBM) - 입력에 스칼라 에너지를 할당하고 낮은 에너지를 높은 적합도로 해석하는 모델 프레임워크. LeCun(2006) 제안
---EN---
Boltzmann Distribution and Statistical Mechanics - The foundational principle of statistical mechanics whose probability distribution was directly transplanted into AI's core mathematical structures

## The Physical Principle of the Boltzmann Distribution

Consider the air molecules in a room. Trillions of molecules constantly collide and exchange energy, yet given enough time the whole system settles into a stable statistical pattern. Fast-moving (high-energy) molecules are few; slow-moving (low-energy) ones are many. Ludwig Boltzmann (1877) captured this pattern in a single equation:

P(state) = e^(-E/kT) / Z

P is the probability of the system occupying a state with energy E. k is the Boltzmann constant (1.38 x 10^-23 J/K), a unit-conversion constant linking the microscopic world to macroscopic temperature, and T is absolute temperature. Z in the denominator is the partition function, a normalization constant summing weights over all possible states.

The core intuition is concise: **lower energy states are more probable.** And temperature determines the "width" of this distribution.

- As T approaches 0: the system is locked into the single lowest energy state.
- As T goes to infinity: every state becomes equally likely.
- At intermediate temperatures: lower energy states are preferred, but higher energy states still have nonzero probability.

## From Statistical Mechanics to AI: Direct Transplantation of the Mathematics

What makes the Boltzmann distribution's entry into AI exceptional is that it was not a metaphorical borrowing but a **direct transplantation of mathematical form**. The key pathways were:

- Metropolis et al. (1953) created an accept-reject rule based on the Boltzmann distribution --> This led 30 years later to Kirkpatrick et al.'s (1983) Simulated Annealing
- Hinton & Sejnowski (1983) directly imported the Boltzmann distribution as the neuron activation rule, creating the Boltzmann Machine
- The mathematical form e^(z/T) / sum e^(z_j/T) was carried over verbatim as the softmax function
- Free energy F = -kT ln Z provided a structure mathematically equivalent to the ELBO in variational inference

The correspondences between physics and AI are:

## Softmax: The Living Descendant of the Boltzmann Distribution

The softmax function, one of the most ubiquitous in AI, takes the mathematical form of the Boltzmann distribution directly:

P(class_i) = e^(z_i / T) / sum_j e^(z_j / T)

Compared to the Boltzmann distribution in physics, three things changed: (1) Energy E was replaced by logit z. (2) The negative sign became positive -- only the direction differs, the structure is identical. (3) The Boltzmann constant k was dropped. Apart from these, it is the **same equation**.

Temperature T plays exactly the same role as in physics. In LLM text generation, temperature = 0.1 selects the highest-logit token almost deterministically, while temperature = 2.0 allows diverse tokens to be selected.

## The Partition Function: Powerful but Intractable

The partition function Z is a "master key" in physics -- knowing Z allows derivation of all thermodynamic quantities. In AI, the denominator of softmax is precisely this partition function.

But there is a fundamental obstacle to computing Z exactly: it requires summing over all possible states. For a system with N binary variables, the number of states is 2^N. With 100 variables that is about 10^30. This **intractability of the partition function** became the greatest barrier for Boltzmann distribution-based AI models.

## Boltzmann Machines: When Physics Became Neural Networks

Hinton and Sejnowski (1983) directly imported the Boltzmann distribution as a neural network's learning principle, creating the Boltzmann Machine. The energy function E(s) = -sum_{i<j} w_ij * s_i * s_j - sum_i b_i * s_i governs neuron activation via the Boltzmann distribution. Just as interaction energies determine particle configurations, weights between neurons determine network state probabilities.

But the partition function wall stood in the way. Smolensky's (1986) Restricted Boltzmann Machine (RBM) removed same-layer connections to simplify computation, but exact computation of Z remained impossible.

## Contrastive Divergence and the Deep Learning Revolution

Hinton's (2002) Contrastive Divergence (CD) algorithm opened the decisive breakthrough. Instead of running MCMC sampling to full convergence, CD runs just 1 to a few steps to approximate the gradient. Rather than computing Z directly, it estimated only the direction of Z's change.

Thanks to this technique, Hinton (2006) successfully pre-trained Deep Belief Networks (DBNs) by stacking RBMs layer by layer. This greedy layer-wise pre-training was the first empirical demonstration that deep neural networks could be trained, catalyzing the deep learning renaissance from 2006 onward.

## Connections to Modern AI

The mathematical structure of the Boltzmann distribution lives on in many areas of modern AI.

**Direct application of the same mathematical principle:**

- **Softmax function**: Present in nearly every modern classifier and language model, softmax is the mathematical form of the Boltzmann distribution itself. The temperature parameter in GPT, Claude, and others produces the same mathematical effect as T in the Boltzmann distribution.
- **Boltzmann machines and RBMs**: Cases where the Boltzmann distribution was directly applied as the neuron activation rule. They opened the deep learning era through DBN pre-training, but were overtaken by backpropagation-based deep networks from the 2010s onward.
- **Energy-based models (EBMs)**: A framework proposed by LeCun (2006) that generalized the "low energy = high probability" principle.
- **Variational inference and ELBO**: Free energy F = -kT ln Z compresses the competition between energy and entropy into a single quantity. The ELBO of VAEs (Kingma & Welling 2014) is mathematically equivalent to the variational free energy of statistical mechanics.

**Structural similarities sharing the same intuition independently:**

## Limitations and Weaknesses

- **Intractability of partition function Z**: The most fundamental barrier for Boltzmann distribution-based models. Approximation methods like CD are imprecise, making Boltzmann machines practically inferior to backpropagation-trained networks.
- **Equilibrium assumption limitations**: The Boltzmann distribution holds only at thermal equilibrium. Actual neural network training resembles non-equilibrium dynamics, creating a gap between theoretical guarantees and real behavior.
- **Slow mixing in high-dimensional sampling**: MCMC-based sampling fails to efficiently explore state space as dimensionality increases, limiting the scalability of Boltzmann distribution-based models.
- **Historical decline and survival**: Boltzmann machines, RBMs, and DBNs have left the mainstream since the 2010s. Yet the mathematics lives on in softmax, temperature parameters, and ELBO. The original model faded but its mathematical skeleton survived.

## Glossary

Boltzmann distribution - a distribution describing the probability of a system in thermal equilibrium occupying a state with energy E. Takes the form P ~ e^(-E/kT), with lower energy meaning higher probability

Partition function - the normalization constant of the Boltzmann distribution. The sum of Boltzmann weights over all possible states, Z = sum e^(-E/kT)

Free energy - a thermodynamic function compressing the competition between energy (stability) and entropy (disorder) into a single quantity. F = -kT ln Z

Softmax - a function converting a real-valued vector into a probability distribution. Mathematically the same form as the Boltzmann distribution with the sign flipped and k dropped

Logit - the unnormalized score vector input to softmax. The output of a neural network's final layer, corresponding to energy in the Boltzmann distribution

Contrastive divergence (CD) - a learning algorithm proposed by Hinton (2002). Approximates the gradient by running MCMC for just a few steps instead of computing the partition function directly

Restricted Boltzmann Machine (RBM) - a variant of the Boltzmann machine ensuring conditional independence by removing same-layer connections. Proposed by Smolensky (1986)

Energy-based model (EBM) - a model framework assigning scalar energy to inputs and interpreting low energy as high compatibility. Proposed by LeCun (2006)
